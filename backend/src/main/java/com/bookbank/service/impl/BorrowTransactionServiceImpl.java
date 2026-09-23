package com.bookbank.service.impl;

import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.dto.response.ReservationResponse;
import com.bookbank.dto.response.StudentLibrarySummaryResponse;
import com.bookbank.entity.Book;
import com.bookbank.entity.BookCopy;
import com.bookbank.entity.BookCopy.CopyStatus;
import com.bookbank.entity.BorrowTransaction;
import com.bookbank.entity.BorrowTransaction.BorrowStatus;
import com.bookbank.entity.NotificationType;
import com.bookbank.entity.Reservation;
import com.bookbank.entity.Reservation.ReservationStatus;
import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import com.bookbank.exception.BookNotAvailableException;
import com.bookbank.exception.BorrowLimitExceededException;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.BorrowTransactionMapper;
import com.bookbank.mapper.ReservationMapper;
import com.bookbank.repository.BookCopyRepository;
import com.bookbank.repository.BookRepository;
import com.bookbank.repository.BorrowTransactionRepository;
import com.bookbank.repository.ReservationRepository;
import com.bookbank.repository.UserRepository;
import com.bookbank.service.BorrowTransactionService;
import com.bookbank.service.NotificationService;
import com.bookbank.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Core borrowing workflow:
 *   Student requests -> Librarian/Admin approves -> Book issued -> Student returns
 *
 * Availability & fines:
 *  - A REQUEST does not lock a copy; a copy is only reserved for the student
 *    when the request is APPROVED (this is when we pick a specific AVAILABLE copy).
 *  - Fines accrue at SettingsService.getFinePerDay() for every day past the due date.
 */
@Service
@RequiredArgsConstructor
public class BorrowTransactionServiceImpl implements BorrowTransactionService {

    private final BorrowTransactionRepository borrowTransactionRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BorrowTransactionMapper borrowTransactionMapper;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationMapper reservationMapper;
    private final SettingsService settingsService;
    private final NotificationService notificationService;
    private final ReservationService reservationService;

    private static final List<BorrowStatus> ACTIVE_STATUSES =
            List.of(BorrowStatus.REQUESTED, BorrowStatus.APPROVED, BorrowStatus.ISSUED, BorrowStatus.OVERDUE);

    @Override
    @Transactional
    public BorrowTransactionResponse requestBorrow(User student, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        if (Boolean.TRUE.equals(book.getIsDeleted())) {
            throw new ResourceNotFoundException("Book not found with id: " + bookId);
        }

        // Eligibility checks
        checkStudentEligibility(student);

        long activeCount = borrowTransactionRepository.countByUserAndStatusIn(student, ACTIVE_STATUSES);
        int maxAllowed = settingsService.getMaxBooksPerStudent();
        if (activeCount >= maxAllowed) {
            throw new BorrowLimitExceededException(
                    "You have reached the maximum number of borrowed/requested books (" + maxAllowed + ")");
        }

        if (book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            throw new BookNotAvailableException(
                    "'" + book.getTitle() + "' has no available copies right now. You can reserve it instead.");
        }

        // We don't lock a specific copy yet - that happens at approval time.
        // We create a placeholder transaction against any available copy so the
        // record exists; the librarian confirms the copy at approval.
        BookCopy anyAvailableCopy = bookCopyRepository.findFirstByBookAndStatus(book, CopyStatus.AVAILABLE)
                .orElseThrow(() -> new BookNotAvailableException("No available copy found for this book"));

        BorrowTransaction transaction = BorrowTransaction.builder()
                .user(student)
                .bookCopy(anyAvailableCopy)
                .requestDate(LocalDateTime.now())
                .status(BorrowStatus.REQUESTED)
                .fineAmount(BigDecimal.ZERO)
                .finePaid(false)
                .build();

        BorrowTransaction saved = borrowTransactionRepository.save(transaction);

        // Auto-approve if all conditions are met
        try {
            return autoApprovePendingRequest(saved.getId());
        } catch (Exception e) {
            // If auto-approval fails, keep as REQUESTED for manual review
            return borrowTransactionMapper.toResponse(saved);
        }
    }

    /**
     * Checks if student is eligible to borrow based on fines, overdue books, and other rules.
     */
    private void checkStudentEligibility(User student) {
        // Check for unpaid fines
        BigDecimal unpaidFines = borrowTransactionRepository.sumUnpaidFines(student);
        if (unpaidFines != null && unpaidFines.compareTo(BigDecimal.ZERO) > 0) {
            throw new BorrowLimitExceededException(
                    "You have unpaid fines of ₹" + unpaidFines + ". Please clear them before borrowing.");
        }

        // Check for overdue books
        long overdueCount = borrowTransactionRepository.countByUserAndStatusIn(
                student, List.of(BorrowStatus.OVERDUE));
        if (overdueCount > 0) {
            throw new BorrowLimitExceededException(
                    "You have " + overdueCount + " overdue book(s). Please return them before borrowing.");
        }
    }

    @Override
    @Transactional
    public BorrowTransactionResponse approve(Long transactionId) {
        BorrowTransaction transaction = getTransactionOrThrow(transactionId);

        if (transaction.getStatus() != BorrowStatus.REQUESTED) {
            throw new InvalidRequestException("Only REQUESTED transactions can be approved");
        }

        // Check student eligibility before manual approval
        checkStudentEligibility(transaction.getUser());

        BookCopy copy = transaction.getBookCopy();
        if (copy.getStatus() != CopyStatus.AVAILABLE) {
            // The originally linked copy got issued elsewhere in the meantime; find another.
            copy = bookCopyRepository.findFirstByBookAndStatus(copy.getBook(), CopyStatus.AVAILABLE)
                    .orElseThrow(() -> new BookNotAvailableException("No available copy left to issue for this book"));
            transaction.setBookCopy(copy);
        }

        // Mark the copy ISSUED and decrement the book's available count.
        copy.setStatus(CopyStatus.ISSUED);
        bookCopyRepository.save(copy);

        Book book = copy.getBook();
        book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        bookRepository.save(book);

        transaction.setStatus(BorrowStatus.ISSUED);
        transaction.setIssueDate(LocalDateTime.now());
        transaction.setDueDate(LocalDate.now().plusDays(settingsService.getBorrowPeriodDays()));

        BorrowTransaction saved = borrowTransactionRepository.save(transaction);
        notificationService.notify(transaction.getUser(),
                "Your request for '" + book.getTitle() + "' was approved. Due date: " + transaction.getDueDate(),
                NotificationType.BORROW_REQUEST_APPROVED);
        notificationService.notify(transaction.getUser(),
                "You have been issued '" + book.getTitle() + "'. Please return it by " + transaction.getDueDate() + ".",
                NotificationType.BOOK_ISSUED);

        return borrowTransactionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BorrowTransactionResponse reject(Long transactionId) {
        BorrowTransaction transaction = getTransactionOrThrow(transactionId);

        if (transaction.getStatus() != BorrowStatus.REQUESTED) {
            throw new InvalidRequestException("Only REQUESTED transactions can be rejected");
        }

        transaction.setStatus(BorrowStatus.REJECTED);
        BorrowTransaction saved = borrowTransactionRepository.save(transaction);

        notificationService.notify(transaction.getUser(),
                "Your request for '" + transaction.getBookCopy().getBook().getTitle() + "' was rejected.",
                NotificationType.BORROW_REQUEST_REJECTED);

        return borrowTransactionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BorrowTransactionResponse returnBook(User user, Long transactionId) {
        BorrowTransaction transaction = getTransactionOrThrow(transactionId);

        boolean isStaff = user.getRole() == Role.ADMIN || user.getRole() == Role.LIBRARIAN;
        if (!isStaff && !transaction.getUser().getId().equals(user.getId())) {
            throw new InvalidRequestException("You can only return your own books");
        }

        if (transaction.getStatus() != BorrowStatus.ISSUED && transaction.getStatus() != BorrowStatus.OVERDUE) {
            throw new InvalidRequestException("Only ISSUED or OVERDUE transactions can be returned");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        transaction.setReturnDate(now);

        BigDecimal finalFine = BigDecimal.ZERO;
        if (transaction.getDueDate() != null && today.isAfter(transaction.getDueDate())) {
            long overdueDays = ChronoUnit.DAYS.between(transaction.getDueDate(), today);
            finalFine = settingsService.getFinePerDay().multiply(BigDecimal.valueOf(overdueDays));
        }

        BigDecimal paidAmount = transaction.getFinePaidAmount();
        if (paidAmount == null) {
            paidAmount = Boolean.TRUE.equals(transaction.getFinePaid()) && transaction.getFineAmount() != null
                    ? transaction.getFineAmount()
                    : BigDecimal.ZERO;
        }
        transaction.setFineAmount(finalFine);
        transaction.setFinePaidAmount(paidAmount);
        transaction.setFinePaid(finalFine.compareTo(BigDecimal.ZERO) > 0 && paidAmount.compareTo(finalFine) >= 0);
        transaction.setStatus(BorrowStatus.RETURNED);

        BookCopy copy = transaction.getBookCopy();
        Book book = copy.getBook();

        boolean hasQueue = reservationService.hasActiveQueue(book.getId());
        copy.setStatus(hasQueue ? CopyStatus.RESERVED : CopyStatus.AVAILABLE);
        bookCopyRepository.save(copy);

        if (!hasQueue) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepository.save(book);
        }

        BorrowTransaction saved = borrowTransactionRepository.save(transaction);

        if (hasQueue) {
            reservationService.notifyNextInQueue(book.getId());
        }

        notificationService.notify(user,
                "You have returned '" + book.getTitle() + "'. " +
                (finalFine.compareTo(BigDecimal.ZERO) > 0
                        ? "Fine amount: ₹" + finalFine
                        : "No fine."),
                NotificationType.BOOK_RETURNED);

        if (finalFine.compareTo(BigDecimal.ZERO) > 0) {
            notificationService.notify(user,
                    "A fine of ₹" + finalFine + " has been applied for '" + book.getTitle() + "'.",
                    NotificationType.FINE_CREATED);
        }

        return borrowTransactionMapper.toResponse(
                saved,
                settingsService.getFinePerDay(),
                borrowTransactionMapper.calculateOverdueDays(saved, today),
                null);
    }

    @Override
    public List<BorrowTransactionResponse> getFiltered(String keyword, List<BorrowStatus> statuses,
                                                       Boolean finePaid, LocalDateTime requestDateFrom,
                                                       LocalDateTime requestDateTo) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository
                .findFiltered(keyword, statuses, finePaid, requestDateFrom, requestDateTo)
                .stream()
                .map(t -> enrichRequestContext(t, finePerDay))
                .toList();
    }

    @Override
    public List<BorrowTransactionResponse> getAll() {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository.findAllWithDetails().stream()
                .map(t -> enrichRequestContext(t, finePerDay))
                .toList();
    }

    @Override
    public List<BorrowTransactionResponse> getPending() {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository.findByStatusWithDetails(BorrowStatus.REQUESTED).stream()
                .map(t -> enrichRequestContext(t, finePerDay))
                .toList();
    }

    @Override
    public List<BorrowTransactionResponse> getMyHistory(User user) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository.findByUserWithDetailsOrderByRequestDateDesc(user).stream()
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();
    }

    private BorrowTransactionResponse enrichRequestContext(BorrowTransaction t, BigDecimal finePerDay) {
        User student = t.getUser();
        Book book = t.getBookCopy().getBook();

        Integer availableCopies = book.getAvailableCopies();
        long currentlyBorrowed = borrowTransactionRepository.countByUserAndStatusIn(
                student, List.of(BorrowStatus.ISSUED, BorrowStatus.OVERDUE));
        long overdueCount = borrowTransactionRepository.countByUserAndStatusIn(
                student, List.of(BorrowStatus.OVERDUE));
        BigDecimal unpaidFines = borrowTransactionRepository.sumUnpaidFines(student);
        if (unpaidFines == null) unpaidFines = BigDecimal.ZERO;

        BorrowTransactionResponse base = borrowTransactionMapper.toResponse(t, finePerDay, null, null);
        base.setBookAvailableCopies(availableCopies);
        base.setStudentCurrentlyBorrowedCount(currentlyBorrowed);
        base.setStudentOverdueCount(overdueCount);
        base.setStudentUnpaidFines(unpaidFines);
        base.setStudentHasOverdue(overdueCount > 0);
        base.setStudentHasUnpaidFines(unpaidFines.compareTo(BigDecimal.ZERO) > 0);
        return base;
    }

    @Override
    public List<BorrowTransactionResponse> getMyCurrentlyBorrowed(User user) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository
                .findByUserAndStatusInWithDetails(user, List.of(BorrowStatus.ISSUED, BorrowStatus.OVERDUE)).stream()
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowTransactionResponse> getMyFines(User user) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        LocalDate now = LocalDate.now();
        return borrowTransactionRepository.findByUserWithDetailsOrderByRequestDateDesc(user).stream()
                .filter(t -> t.getFineAmount() != null && t.getFineAmount().compareTo(BigDecimal.ZERO) > 0)
                .map(t -> {
                    Long overdueDays = calculateOverdueDays(t, now);
                    BigDecimal calculatedFine = overdueDays > 0
                        ? finePerDay.multiply(BigDecimal.valueOf(overdueDays))
                        : BigDecimal.ZERO;
                    return borrowTransactionMapper.toResponse(t, finePerDay, overdueDays, calculatedFine);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowTransactionResponse> getMyUnpaidFines(User user) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        LocalDate now = LocalDate.now();
        return borrowTransactionRepository.findByUserWithDetailsOrderByRequestDateDesc(user).stream()
                .filter(t -> !Boolean.TRUE.equals(t.getFinePaid()))
                .map(t -> {
                    Long overdueDays = calculateOverdueDays(t, now);
                    BigDecimal calculatedFine = overdueDays > 0
                        ? finePerDay.multiply(BigDecimal.valueOf(overdueDays))
                        : BigDecimal.ZERO;
                    return borrowTransactionMapper.toResponse(t, finePerDay, overdueDays, calculatedFine);
                })
                .filter(t -> t.getFineAmount() != null && t.getFineAmount().compareTo(BigDecimal.ZERO) > 0)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getUnpaidFineTotal() {
        BigDecimal total = borrowTransactionRepository.sumUnpaidFines();
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getUnpaidFineTotal(User user) {
        BigDecimal total = borrowTransactionRepository.sumUnpaidFines(user);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BorrowTransactionResponse> getAdminFines(String paymentStatus, String keyword) {
        BigDecimal finePerDay = settingsService.getFinePerDay();
        LocalDate now = LocalDate.now();
        return borrowTransactionRepository.findAllWithDetails().stream()
                .map(t -> {
                    Long overdueDays = calculateOverdueDays(t, now);
                    return borrowTransactionMapper.toResponse(t, finePerDay, overdueDays, null);
                })
                .filter(t -> matchesPaymentFilter(t, paymentStatus))
                .filter(t -> matchesKeyword(t, keyword))
                .toList();
    }

    private boolean matchesPaymentFilter(BorrowTransactionResponse t, String paymentStatus) {
        if (paymentStatus == null || paymentStatus.equalsIgnoreCase("ALL")) {
            return true;
        }
        String status = t.getFinePaymentStatus();
        if (status == null) return false;
        return status.equalsIgnoreCase(paymentStatus);
    }

    private boolean matchesKeyword(BorrowTransactionResponse t, String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return true;
        String k = keyword.toLowerCase();
        return (t.getUserName() != null && t.getUserName().toLowerCase().contains(k))
                || (t.getUserEmail() != null && t.getUserEmail().toLowerCase().contains(k))
                || (t.getUserRegisterNumber() != null && t.getUserRegisterNumber().toLowerCase().contains(k))
                || (t.getBookTitle() != null && t.getBookTitle().toLowerCase().contains(k))
                || (t.getCopyCode() != null && t.getCopyCode().toLowerCase().contains(k));
    }

    @Override
    @Transactional(readOnly = true)
    public StudentLibrarySummaryResponse getStudentLibrarySummary(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        BigDecimal finePerDay = settingsService.getFinePerDay();
        LocalDate now = LocalDate.now();

        List<BorrowTransaction> allTransactions =
                borrowTransactionRepository.findByUserWithDetailsOrderByRequestDateDesc(student);

        List<BorrowTransactionResponse> currentlyBorrowed = allTransactions.stream()
                .filter(t -> t.getStatus() == BorrowStatus.ISSUED || t.getStatus() == BorrowStatus.OVERDUE)
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();

        List<BorrowTransactionResponse> overdueBooks = allTransactions.stream()
                .filter(t -> t.getStatus() == BorrowStatus.OVERDUE)
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();

        List<BorrowTransactionResponse> pendingRequests = allTransactions.stream()
                .filter(t -> t.getStatus() == BorrowStatus.REQUESTED)
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();

        List<ReservationResponse> activeReservations = reservationRepository
                .findByUserOrderByReservationDateDesc(student).stream()
                .filter(r -> r.getStatus() == ReservationStatus.ACTIVE)
                .map(reservationMapper::toResponse)
                .toList();

        BigDecimal currentUnpaidFine = borrowTransactionRepository.sumUnpaidFines(student);
        if (currentUnpaidFine == null) currentUnpaidFine = BigDecimal.ZERO;

        BigDecimal totalPaidFine = borrowTransactionRepository.sumPaidFines(student);
        if (totalPaidFine == null) totalPaidFine = BigDecimal.ZERO;

        long totalTransactions = allTransactions.size();
        long currentlyBorrowedCount = currentlyBorrowed.size();
        long returnedCount = allTransactions.stream()
                .filter(t -> t.getStatus() == BorrowStatus.RETURNED)
                .count();
        long overdueCount = overdueBooks.size();

        return StudentLibrarySummaryResponse.builder()
                .studentId(student.getId())
                .studentName(student.getName())
                .studentEmail(student.getEmail())
                .studentRegisterNumber(student.getRegisterNumber())
                .role(student.getRole().name())
                .active(student.getActive())
                .createdAt(student.getCreatedAt())
                .currentlyBorrowed(currentlyBorrowed)
                .overdueBooks(overdueBooks)
                .pendingRequests(pendingRequests)
                .activeReservations(activeReservations)
                .currentUnpaidFine(currentUnpaidFine)
                .totalPaidFine(totalPaidFine)
                .overdueTransactionCount(overdueCount)
                .totalBorrowingTransactions(totalTransactions)
                .currentlyBorrowedCount(currentlyBorrowedCount)
                .returnedBooksCount(returnedCount)
                .overdueCount(overdueCount)
                .build();
    }

    @Override
    public List<BorrowTransactionResponse> getOverdue() {
        refreshOverdueStatuses();
        BigDecimal finePerDay = settingsService.getFinePerDay();
        return borrowTransactionRepository.findOverdueWithDetails(LocalDate.now()).stream()
                .map(t -> borrowTransactionMapper.toResponse(t, finePerDay, null, null))
                .toList();
    }

    private Long calculateOverdueDays(BorrowTransaction t, LocalDate now) {
        if (t.getDueDate() == null) return 0L;
        if (now.isBefore(t.getDueDate()) || now.isEqual(t.getDueDate())) {
            return 0L;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(t.getDueDate(), now);
    }

    @Override
    @Transactional
    public void refreshOverdueStatuses() {
        List<BorrowTransaction> overdue = borrowTransactionRepository.findOverdue(LocalDate.now());
        for (BorrowTransaction t : overdue) {
            if (t.getStatus() == BorrowStatus.ISSUED) {
                t.setStatus(BorrowStatus.OVERDUE);
                notificationService.notify(t.getUser(),
                        "⚠ '" + t.getBookCopy().getBook().getTitle() + "' is now overdue. Please return it soon.",
                        NotificationType.BOOK_OVERDUE);
            }
        }
        borrowTransactionRepository.saveAll(overdue);
    }

    @Override
    @Transactional
    public BorrowTransactionResponse autoApprovePendingRequest(Long transactionId) {
        BorrowTransaction transaction = getTransactionOrThrow(transactionId);

        if (transaction.getStatus() != BorrowStatus.REQUESTED) {
            throw new InvalidRequestException("Only REQUESTED transactions can be auto-approved");
        }

        // Check all eligibility conditions
        User student = transaction.getUser();

        // 1. Student has no unpaid fines
        BigDecimal unpaidFines = borrowTransactionRepository.sumUnpaidFines(student);
        if (unpaidFines != null && unpaidFines.compareTo(BigDecimal.ZERO) > 0) {
            throw new InvalidRequestException("Student has unpaid fines. Cannot auto-approve.");
        }

        // 2. Student has no overdue books
        long overdueCount = borrowTransactionRepository.countByUserAndStatusIn(
                student, List.of(BorrowStatus.OVERDUE));
        if (overdueCount > 0) {
            throw new InvalidRequestException("Student has overdue books. Cannot auto-approve.");
        }

        // 3. Student has not reached borrowing limit
        long activeCount = borrowTransactionRepository.countByUserAndStatusIn(student, ACTIVE_STATUSES);
        int maxAllowed = settingsService.getMaxBooksPerStudent();
        if (activeCount >= maxAllowed) {
            throw new InvalidRequestException("Student has reached borrowing limit. Cannot auto-approve.");
        }

        // 4. Book copy is still available
        BookCopy copy = transaction.getBookCopy();
        Book book = copy.getBook();
        if (copy.getStatus() != CopyStatus.AVAILABLE || book.getAvailableCopies() == null || book.getAvailableCopies() <= 0) {
            // Try to find another available copy
            copy = bookCopyRepository.findFirstByBookAndStatus(book, CopyStatus.AVAILABLE)
                    .orElseThrow(() -> new InvalidRequestException("No available copy left. Cannot auto-approve."));
            transaction.setBookCopy(copy);
        }

        // All conditions met - approve
        copy.setStatus(CopyStatus.ISSUED);
        bookCopyRepository.save(copy);

        book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        bookRepository.save(book);

        transaction.setStatus(BorrowStatus.ISSUED);
        transaction.setIssueDate(LocalDateTime.now());
        transaction.setDueDate(LocalDate.now().plusDays(settingsService.getBorrowPeriodDays()));

        BorrowTransaction saved = borrowTransactionRepository.save(transaction);
        notificationService.notify(student,
                "Your request for '" + book.getTitle() + "' was auto-approved. Due date: " + transaction.getDueDate(),
                NotificationType.BORROW_REQUEST_APPROVED);
        notificationService.notify(student,
                "You have been issued '" + book.getTitle() + "'. Please return it by " + transaction.getDueDate() + ".",
                NotificationType.BOOK_ISSUED);

        return borrowTransactionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BorrowTransactionResponse payFine(User student, Long transactionId, String txnId) {
        BorrowTransaction transaction = getTransactionOrThrow(transactionId);

        // Verify ownership
        if (!transaction.getUser().getId().equals(student.getId())) {
            throw new InvalidRequestException("You can only pay your own fines");
        }

        // Calculate current outstanding fine
        BigDecimal currentFine = borrowTransactionMapper.calculateFineAmount(transaction, settingsService.getFinePerDay(), LocalDate.now());

        // Determine already paid amount
        BigDecimal alreadyPaid = transaction.getFinePaidAmount();
        if (alreadyPaid == null) {
            alreadyPaid = Boolean.TRUE.equals(transaction.getFinePaid()) && currentFine.compareTo(BigDecimal.ZERO) > 0
                    ? currentFine
                    : BigDecimal.ZERO;
        }
        BigDecimal remaining = currentFine.subtract(alreadyPaid).max(BigDecimal.ZERO);

        // Reject payment only when actual outstanding fine is zero or already fully paid
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("No unpaid fine exists for this transaction");
        }

        transaction.setFineAmount(currentFine);
        transaction.setFinePaid(true);
        transaction.setFinePaidAmount(currentFine);
        transaction.setFinePaymentTxnId(txnId);
        transaction.setFinePaymentDate(LocalDateTime.now());

        BorrowTransaction saved = borrowTransactionRepository.save(transaction);
        notificationService.notify(student,
                "Your fine of ₹" + currentFine + " for '" + transaction.getBookCopy().getBook().getTitle() + "' has been paid.",
                NotificationType.FINE_PAID);

        return borrowTransactionMapper.toResponse(saved);
    }

    private BorrowTransaction getTransactionOrThrow(Long id) {
        return borrowTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Borrow transaction not found with id: " + id));
    }
}

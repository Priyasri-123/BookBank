package com.bookbank.service.impl;

import com.bookbank.dto.response.AdminDashboardResponse;
import com.bookbank.dto.response.LibrarianDashboardResponse;
import com.bookbank.dto.response.StudentDashboardResponse;
import com.bookbank.entity.BookCopy;
import com.bookbank.entity.BorrowTransaction.BorrowStatus;
import com.bookbank.entity.Reservation.ReservationStatus;
import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import com.bookbank.mapper.BorrowTransactionMapper;
import com.bookbank.mapper.ReservationMapper;
import com.bookbank.repository.*;
import com.bookbank.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BookCopyRepository bookCopyRepository;
    private final BorrowTransactionRepository borrowTransactionRepository;
    private final ReservationRepository reservationRepository;
    private final BorrowTransactionMapper borrowTransactionMapper;
    private final ReservationMapper reservationMapper;
    private final SettingsService settingsService;

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        return AdminDashboardResponse.builder()
                .totalStudents(userRepository.countByRole(Role.STUDENT))
                .totalBooks(bookRepository.countByIsDeletedFalse())
                .totalBookCopies(bookRepository.sumTotalCopies())
                .availableBookCopies(bookRepository.sumAvailableCopies())
                .issuedBooks(borrowTransactionRepository.countByStatus(BorrowStatus.ISSUED))
                .overdueBooks(borrowTransactionRepository.countByStatus(BorrowStatus.OVERDUE))
                .pendingRequests(borrowTransactionRepository.countByStatus(BorrowStatus.REQUESTED))
                .activeReservations(reservationRepository.countByStatus(ReservationStatus.ACTIVE))
                .totalUnpaidFines(nullSafe(borrowTransactionRepository.sumUnpaidFines()))
                .build();
    }

    @Override
    public LibrarianDashboardResponse getLibrarianDashboard() {
        return LibrarianDashboardResponse.builder()
                .pendingRequests(borrowTransactionRepository.countByStatus(BorrowStatus.REQUESTED))
                .issuedToday(borrowTransactionRepository.countIssuedToday(java.time.LocalDate.now()))
                .returnedToday(borrowTransactionRepository.countReturnedToday(java.time.LocalDate.now()))
                .overdueBooks(borrowTransactionRepository.countByStatus(BorrowStatus.OVERDUE))
                .availableBooks(bookCopyRepository.countByStatus(BookCopy.CopyStatus.AVAILABLE))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentDashboardResponse getStudentDashboard(User student) {
        List<BorrowStatus> activeStatuses = List.of(BorrowStatus.ISSUED, BorrowStatus.OVERDUE);
        var currentlyBorrowed = borrowTransactionRepository.findByUserAndStatusIn(student, activeStatuses).stream()
                .map(borrowTransactionMapper::toResponse).toList();

        long overdueCount = currentlyBorrowed.stream().filter(t -> "OVERDUE".equals(t.getStatus())).count();

        BigDecimal currentFines = currentlyBorrowed.stream()
                .map(t -> t.getFineAmount() == null ? BigDecimal.ZERO : t.getFineAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var activeReservations = reservationRepository.findByUserOrderByReservationDateDesc(student).stream()
                .filter(r -> r.getStatus() == ReservationStatus.ACTIVE || r.getStatus() == ReservationStatus.FULFILLED)
                .map(reservationMapper::toResponse).toList();

        long totalBorrowedAllTime = borrowTransactionRepository.findByUserOrderByRequestDateDesc(student).size();

        Long totalBooks = bookRepository.countByIsDeletedFalse();
        Long pendingRequests = borrowTransactionRepository.countByUserAndStatusIn(
                student, List.of(BorrowStatus.REQUESTED));
        
        // Calculate unpaid fines consistently using the mapper which already calculates dynamically
        BigDecimal unpaidFines = borrowTransactionRepository.findByUserWithDetailsOrderByRequestDateDesc(student).stream()
                .filter(t -> !Boolean.TRUE.equals(t.getFinePaid()))
                .map(borrowTransactionMapper::toResponse)
                .map(t -> t.getFineAmount() == null ? BigDecimal.ZERO : t.getFineAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return StudentDashboardResponse.builder()
                .currentlyBorrowed(currentlyBorrowed)
                .overdueCount(overdueCount)
                .currentFines(currentFines)
                .activeReservations(activeReservations)
                .totalBorrowedAllTime(totalBorrowedAllTime)
                .totalBooks(totalBooks)
                .pendingRequests(pendingRequests)
                .unpaidFines(unpaidFines)
                .build();
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}

package com.bookbank.service.impl;

import com.bookbank.entity.*;
import com.bookbank.entity.BookCopy.CopyStatus;
import com.bookbank.entity.BorrowTransaction.BorrowStatus;
import com.bookbank.exception.BookNotAvailableException;
import com.bookbank.exception.BorrowLimitExceededException;
import com.bookbank.mapper.BorrowTransactionMapper;
import com.bookbank.repository.BookCopyRepository;
import com.bookbank.repository.BookRepository;
import com.bookbank.repository.BorrowTransactionRepository;
import com.bookbank.service.NotificationService;
import com.bookbank.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BorrowTransactionServiceImplTest {

    @Mock
    private BorrowTransactionRepository borrowTransactionRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private BookCopyRepository bookCopyRepository;

    @Mock
    private BorrowTransactionMapper borrowTransactionMapper;

    @Mock
    private SettingsService settingsService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private BorrowTransactionServiceImpl borrowTransactionService;

    private User student;
    private Book book;
    private BookCopy copy;

    @BeforeEach
    void setUp() {

        student = User.builder()
                .id(1L)
                .name("Student One")
                .email("s1@test.com")
                .role(Role.STUDENT)
                .build();

        book = Book.builder()
                .id(10L)
                .title("Java Complete Reference")
                .totalCopies(2)
                .availableCopies(1)
                .isDeleted(false)
                .build();

        copy = BookCopy.builder()
                .id(100L)
                .book(book)
                .copyCode("BK001")
                .status(CopyStatus.AVAILABLE)
                .build();
    }

    @Test
    void requestBorrow_throwsException_whenBookHasNoAvailableCopies() {

        book.setAvailableCopies(0);

        when(bookRepository.findById(10L))
                .thenReturn(Optional.of(book));

        when(borrowTransactionRepository.countByUserAndStatusIn(any(), any()))
                .thenReturn(0L);

        when(settingsService.getMaxBooksPerStudent())
                .thenReturn(3);

        assertThatThrownBy(() ->
                borrowTransactionService.requestBorrow(student, 10L)
        )
                .isInstanceOf(BookNotAvailableException.class);
    }


    @Test
    void requestBorrow_throwsException_whenStudentHitsBorrowLimit() {

        /*
         * The service checks whether the book exists BEFORE
         * checking the student's borrow limit.
         *
         * Therefore, we must mock the book lookup.
         */

        when(bookRepository.findById(10L))
                .thenReturn(Optional.of(book));

        when(borrowTransactionRepository.sumUnpaidFines(student))
                .thenReturn(BigDecimal.ZERO);

        when(borrowTransactionRepository.countByUserAndStatusIn(eq(student), argThat(list -> list.size() == 1 && list.contains(BorrowStatus.OVERDUE))))
                .thenReturn(0L);

        when(borrowTransactionRepository.countByUserAndStatusIn(eq(student), argThat(list -> list.size() == 4)))
                .thenReturn(3L);

        when(settingsService.getMaxBooksPerStudent())
                .thenReturn(3);

        assertThatThrownBy(() ->
                borrowTransactionService.requestBorrow(student, 10L)
        )
                .isInstanceOf(BorrowLimitExceededException.class);

        /*
         * The service should stop after the borrow limit is exceeded.
         * Therefore it should NOT search for an available copy.
         */

        verify(bookCopyRepository, never())
                .findFirstByBookAndStatus(any(), any());
    }


    @Test
    void requestBorrow_succeeds_whenCopyIsAvailable() {

        when(bookRepository.findById(10L))
                .thenReturn(Optional.of(book));

        when(borrowTransactionRepository.countByUserAndStatusIn(any(), any()))
                .thenReturn(0L);

        when(settingsService.getMaxBooksPerStudent())
                .thenReturn(3);

        when(bookCopyRepository.findFirstByBookAndStatus(
                book,
                CopyStatus.AVAILABLE
        ))
                .thenReturn(Optional.of(copy));

        when(borrowTransactionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        borrowTransactionService.requestBorrow(student, 10L);

        verify(borrowTransactionRepository)
                .save(argThat(transaction ->
                        transaction.getStatus() == BorrowStatus.REQUESTED
                                && transaction.getUser().equals(student)
                ));
    }


    @Test
    void returnBook_calculatesFine_whenReturnedAfterDueDate() {

        BorrowTransaction transaction = BorrowTransaction.builder()
                .id(50L)
                .user(student)
                .bookCopy(copy)
                .status(BorrowStatus.ISSUED)
                .requestDate(LocalDateTime.now().minusDays(20))
                .issueDate(LocalDateTime.now().minusDays(20))
                .dueDate(LocalDate.now().minusDays(5))
                .fineAmount(BigDecimal.ZERO)
                .finePaid(false)
                .build();

        when(borrowTransactionRepository.findById(50L))
                .thenReturn(Optional.of(transaction));

        when(settingsService.getFinePerDay())
                .thenReturn(BigDecimal.valueOf(5));

        when(reservationService.hasActiveQueue(10L))
                .thenReturn(false);

        when(borrowTransactionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        borrowTransactionService.returnBook(50L);

        assertThat(transaction.getStatus())
                .isEqualTo(BorrowStatus.RETURNED);

        assertThat(transaction.getFineAmount())
                .isEqualByComparingTo(BigDecimal.valueOf(25));

        assertThat(copy.getStatus())
                .isEqualTo(CopyStatus.AVAILABLE);
    }


    @Test
    void returnBook_holdsCopyAsReserved_whenActiveQueueExists() {

        BorrowTransaction transaction = BorrowTransaction.builder()
                .id(51L)
                .user(student)
                .bookCopy(copy)
                .status(BorrowStatus.ISSUED)
                .dueDate(LocalDate.now().plusDays(2))
                .fineAmount(BigDecimal.ZERO)
                .build();

        when(borrowTransactionRepository.findById(51L))
                .thenReturn(Optional.of(transaction));

        when(reservationService.hasActiveQueue(10L))
                .thenReturn(true);

        when(borrowTransactionRepository.save(any()))
                .thenAnswer(invocation -> invocation.getArgument(0));

        borrowTransactionService.returnBook(51L);

        assertThat(copy.getStatus())
                .isEqualTo(CopyStatus.RESERVED);

        verify(reservationService)
                .notifyNextInQueue(10L);

        verify(bookRepository, never())
                .save(book);
    }
}
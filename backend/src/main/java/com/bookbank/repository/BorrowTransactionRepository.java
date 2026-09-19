package com.bookbank.repository;

import com.bookbank.entity.BorrowTransaction;
import com.bookbank.entity.BorrowTransaction.BorrowStatus;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface BorrowTransactionRepository extends JpaRepository<BorrowTransaction, Long> {

    // Standard Spring Data JPA methods (used for count queries and by service)
    List<BorrowTransaction> findByUserOrderByRequestDateDesc(User user);

    List<BorrowTransaction> findByUserAndStatusIn(User user, List<BorrowStatus> statuses);

    long countByUserAndStatusIn(User user, List<BorrowStatus> statuses);

    @Query("SELECT bt FROM BorrowTransaction bt WHERE bt.status = 'ISSUED' AND bt.dueDate < :today")
    List<BorrowTransaction> findOverdue(LocalDate today);

    long countByStatus(BorrowStatus status);

    @Query("SELECT COUNT(bt) FROM BorrowTransaction bt WHERE bt.status = 'ISSUED' AND FUNCTION('DATE', bt.issueDate) = :today")
    long countIssuedToday(LocalDate today);

    @Query("SELECT COUNT(bt) FROM BorrowTransaction bt WHERE bt.status = 'RETURNED' AND FUNCTION('DATE', bt.returnDate) = :today")
    long countReturnedToday(LocalDate today);

    @Query("SELECT COALESCE(SUM(bt.fineAmount), 0) FROM BorrowTransaction bt WHERE bt.finePaid = false")
    java.math.BigDecimal sumUnpaidFines();

    @Query("SELECT COALESCE(SUM(bt.fineAmount), 0) FROM BorrowTransaction bt WHERE bt.user = :user AND bt.finePaid = false")
    java.math.BigDecimal sumUnpaidFines(User user);

    // Eager fetch versions (used for returning full DTOs)
    @Query("SELECT bt FROM BorrowTransaction bt LEFT JOIN FETCH bt.user LEFT JOIN FETCH bt.bookCopy bc LEFT JOIN FETCH bc.book WHERE bt.user = :user ORDER BY bt.requestDate DESC")
    List<BorrowTransaction> findByUserWithDetailsOrderByRequestDateDesc(User user);

    @Query("SELECT bt FROM BorrowTransaction bt LEFT JOIN FETCH bt.user LEFT JOIN FETCH bt.bookCopy bc LEFT JOIN FETCH bc.book WHERE bt.user = :user AND bt.status IN :statuses")
    List<BorrowTransaction> findByUserAndStatusInWithDetails(User user, List<BorrowStatus> statuses);

    @Query("SELECT bt FROM BorrowTransaction bt LEFT JOIN FETCH bt.user LEFT JOIN FETCH bt.bookCopy bc LEFT JOIN FETCH bc.book WHERE bt.status = :status")
    List<BorrowTransaction> findByStatusWithDetails(BorrowStatus status);

    @Query("SELECT bt FROM BorrowTransaction bt LEFT JOIN FETCH bt.user LEFT JOIN FETCH bt.bookCopy bc LEFT JOIN FETCH bc.book")
    List<BorrowTransaction> findAllWithDetails();

    @Query("SELECT bt FROM BorrowTransaction bt LEFT JOIN FETCH bt.user LEFT JOIN FETCH bt.bookCopy bc LEFT JOIN FETCH bc.book WHERE bt.status IN ('ISSUED', 'OVERDUE') AND bt.dueDate < :today")
    List<BorrowTransaction> findOverdueWithDetails(LocalDate today);
}

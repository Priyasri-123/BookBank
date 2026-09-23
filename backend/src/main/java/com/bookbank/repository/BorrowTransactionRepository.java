package com.bookbank.repository;

import com.bookbank.entity.BorrowTransaction;
import com.bookbank.entity.BorrowTransaction.BorrowStatus;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
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

    @Query("SELECT COUNT(DISTINCT bt.user) FROM BorrowTransaction bt WHERE bt.status = 'OVERDUE'")
    long countDistinctStudentsWithOverdueBooks();

    @Query("SELECT COUNT(DISTINCT bt.user) FROM BorrowTransaction bt WHERE bt.finePaid = false AND bt.fineAmount > 0")
    long countDistinctUsersWithUnpaidFines();

    @Query("SELECT COALESCE(SUM(bt.finePaidAmount), 0) FROM BorrowTransaction bt WHERE bt.finePaid = true")
    java.math.BigDecimal sumPaidFines();

    @Query("SELECT COALESCE(SUM(bt.finePaidAmount), 0) FROM BorrowTransaction bt WHERE bt.user = :user AND bt.finePaid = true")
    java.math.BigDecimal sumPaidFines(User user);

    @Query("SELECT bt FROM BorrowTransaction bt JOIN FETCH bt.bookCopy bc JOIN FETCH bc.book b " +
           "WHERE (:keyword IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(bc.copyCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(bt.finePaymentTxnId) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:statuses IS NULL OR bt.status IN :statuses) " +
           "AND (:finePaid IS NULL OR bt.finePaid = :finePaid) " +
           "AND (:requestDateFrom IS NULL OR bt.requestDate >= :requestDateFrom) " +
           "AND (:requestDateTo IS NULL OR bt.requestDate <= :requestDateTo) " +
           "ORDER BY bt.requestDate DESC")
    List<BorrowTransaction> findFiltered(String keyword, List<BorrowStatus> statuses,
                                          Boolean finePaid, LocalDateTime requestDateFrom,
                                          LocalDateTime requestDateTo);

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

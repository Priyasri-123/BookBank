package com.bookbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "borrow_transactions", indexes = {
        @Index(name = "idx_borrow_status", columnList = "status"),
        @Index(name = "idx_borrow_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BorrowTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_copy_id", nullable = false)
    private BookCopy bookCopy;

    @Column(name = "request_date", nullable = false)
    private LocalDateTime requestDate;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDateTime returnDate;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private BorrowStatus status = BorrowStatus.REQUESTED;

    @Builder.Default
    @Column(name = "fine_amount", precision = 10, scale = 2)
    private BigDecimal fineAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "fine_paid", nullable = false)
    private Boolean finePaid = false;

    @Column(name = "fine_payment_txn_id", length = 100)
    private String finePaymentTxnId;

    @Column(name = "fine_payment_date")
    private LocalDateTime finePaymentDate;

    @Builder.Default
    @Column(name = "fine_paid_amount", precision = 10, scale = 2)
    private BigDecimal finePaidAmount = BigDecimal.ZERO;

    public enum BorrowStatus {
        REQUESTED, APPROVED, REJECTED, ISSUED, RETURNED, OVERDUE
    }
}

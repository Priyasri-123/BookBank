package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class BorrowTransactionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userRegisterNumber;
    private Long bookCopyId;
    private String copyCode;
    private String bookTitle;
    private LocalDateTime requestDate;
    private LocalDateTime issueDate;
    private LocalDate dueDate;
    private LocalDateTime returnDate;
    private String status;
    private BigDecimal fineAmount;
    private BigDecimal fineAmountDue;
    private BigDecimal finePaidAmount;
    private Boolean finePaid;
    private String finePaymentStatus;
    private String finePaymentTxnId;
    private LocalDateTime finePaymentDate;
    private Long overdueDays;
    private BigDecimal finePerDay;
    // Request-context fields (populated for admin/librarian request listings)
    private Integer bookAvailableCopies;
    private Long studentCurrentlyBorrowedCount;
    private Long studentOverdueCount;
    private BigDecimal studentUnpaidFines;
    private Boolean studentHasOverdue;
    private Boolean studentHasUnpaidFines;
}

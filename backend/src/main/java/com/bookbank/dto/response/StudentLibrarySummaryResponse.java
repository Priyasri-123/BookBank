package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class StudentLibrarySummaryResponse {
    // Basic student information
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentRegisterNumber;
    private String role;
    private Boolean active;
    private LocalDateTime createdAt;

    // Current library activity
    private List<BorrowTransactionResponse> currentlyBorrowed;
    private List<BorrowTransactionResponse> overdueBooks;
    private List<BorrowTransactionResponse> pendingRequests;
    private List<ReservationResponse> activeReservations;

    // Fine summary
    private BigDecimal currentUnpaidFine;
    private BigDecimal totalPaidFine;
    private long overdueTransactionCount;

    // Borrowing summary
    private long totalBorrowingTransactions;
    private long currentlyBorrowedCount;
    private long returnedBooksCount;
    private long overdueCount;
}
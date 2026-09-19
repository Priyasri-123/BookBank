package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class StudentDashboardResponse {
    private List<BorrowTransactionResponse> currentlyBorrowed;
    private long overdueCount;
    private BigDecimal currentFines;
    private List<ReservationResponse> activeReservations;
    private long totalBorrowedAllTime;

    // Additional summary data for the student dashboard.
    private Long totalBooks;
    private Long pendingRequests;
    private BigDecimal unpaidFines;
}

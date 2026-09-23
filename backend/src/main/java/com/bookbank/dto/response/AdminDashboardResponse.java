package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
public class AdminDashboardResponse {
    private long totalStudents;
    private long totalBooks;
    private long totalBookCopies;
    private long availableBookCopies;
    private long issuedBooks;
    private long overdueBooks;
    private long studentsWithOverdueBooks;
    private long pendingRequests;
    private long activeReservations;
    private BigDecimal totalUnpaidFines;
    private long studentsWithUnpaidFines;
    private BigDecimal totalPaidFines;
}

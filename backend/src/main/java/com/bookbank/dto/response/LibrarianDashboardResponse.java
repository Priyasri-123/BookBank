package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class LibrarianDashboardResponse {
    private long pendingRequests;
    private long issuedToday;
    private long returnedToday;
    private long overdueBooks;
    private long availableBooks;
}

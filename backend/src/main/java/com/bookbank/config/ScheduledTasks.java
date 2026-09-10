package com.bookbank.config;

import com.bookbank.service.BorrowTransactionService;
import com.bookbank.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Runs in the background so overdue books and expired reservations are
 * updated automatically, without waiting for someone to open the dashboard.
 */
@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final BorrowTransactionService borrowTransactionService;
    private final ReservationService reservationService;

    // Every hour: mark ISSUED transactions past their due date as OVERDUE.
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void refreshOverdueTransactions() {
        borrowTransactionService.refreshOverdueStatuses();
    }

    // Every hour: expire reservations whose hold window has passed.
    @Scheduled(fixedRate = 60 * 60 * 1000)
    public void expireReservations() {
        reservationService.expireOldReservations();
    }
}

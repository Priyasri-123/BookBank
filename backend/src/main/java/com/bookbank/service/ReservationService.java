package com.bookbank.service;

import com.bookbank.dto.response.ReservationResponse;
import com.bookbank.entity.User;

import java.util.List;

public interface ReservationService {
    ReservationResponse reserve(User student, Long bookId);
    void cancel(Long reservationId, User requester);
    List<ReservationResponse> getMyReservations(User user);
    List<ReservationResponse> getAll();
    void expireOldReservations(); // scheduled job hook
    void notifyNextInQueue(Long bookId); // called when a copy becomes available
    boolean hasActiveQueue(Long bookId);
}

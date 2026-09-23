package com.bookbank.mapper;

import com.bookbank.dto.response.ReservationResponse;
import com.bookbank.entity.Reservation;
import org.springframework.stereotype.Component;

@Component
public class ReservationMapper {
    public ReservationResponse toResponse(Reservation r) {
        return toResponse(r, null, null);
    }

    public ReservationResponse toResponse(Reservation r, Integer queuePosition, Integer availableCopies) {
        return ReservationResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userName(r.getUser().getName())
                .bookId(r.getBook().getId())
                .bookTitle(r.getBook().getTitle())
                .reservationDate(r.getReservationDate())
                .expiryDate(r.getExpiryDate())
                .status(r.getStatus().name())
                .queuePosition(queuePosition)
                .availableCopies(availableCopies)
                .build();
    }
}

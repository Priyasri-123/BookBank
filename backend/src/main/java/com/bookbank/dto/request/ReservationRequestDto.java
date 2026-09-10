package com.bookbank.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReservationRequestDto {
    @NotNull(message = "Book id is required")
    private Long bookId;
}

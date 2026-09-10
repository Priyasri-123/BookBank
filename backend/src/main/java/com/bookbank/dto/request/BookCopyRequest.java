package com.bookbank.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookCopyRequest {

    @NotNull(message = "Book id is required")
    private Long bookId;

    @NotBlank(message = "Copy code is required")
    private String copyCode;

    private String condition;
    private LocalDate purchaseDate;
}

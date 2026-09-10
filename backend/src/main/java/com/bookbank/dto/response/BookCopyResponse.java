package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
public class BookCopyResponse {
    private Long id;
    private Long bookId;
    private String bookTitle;
    private String copyCode;
    private String status;
    private String condition;
    private LocalDate purchaseDate;
}

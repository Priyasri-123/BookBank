package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String isbn;
    private String title;
    private String description;
    private String authorName;
    private Long authorId;
    private String publisherName;
    private Long publisherId;
    private String categoryName;
    private Long categoryId;
    private String language;
    private String edition;
    private Integer publicationYear;
    private Integer totalCopies;
    private Integer availableCopies;
    private Integer issuedCopies;
    private Integer damagedCopies;
    private Integer lostCopies;
    private String bookStatus;
    private String imageUrl;
}

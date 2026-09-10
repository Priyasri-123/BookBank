package com.bookbank.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookRequest {

    @NotBlank(message = "ISBN is required")
    @Pattern(regexp = "^[0-9\\-Xx]{10,20}$", message = "ISBN format is invalid")
    private String isbn;

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Author is required")
    private Long authorId;

    @NotNull(message = "Publisher is required")
    private Long publisherId;

    @NotNull(message = "Category is required")
    private Long categoryId;

    private String language;
    private String edition;
    private Integer publicationYear;

    @NotNull(message = "Total copies is required")
    @Min(value = 0, message = "Total copies cannot be negative")
    private Integer totalCopies;

    private String imageUrl;
}

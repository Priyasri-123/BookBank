package com.bookbank.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthorRequest {
    @NotBlank(message = "Author name is required")
    private String name;
    private String bio;
}

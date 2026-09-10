package com.bookbank.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PublisherRequest {
    @NotBlank(message = "Publisher name is required")
    private String name;
    private String website;
}

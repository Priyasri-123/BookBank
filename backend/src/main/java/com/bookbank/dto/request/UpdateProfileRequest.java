package com.bookbank.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 100)
    private String name;

    @Pattern(regexp = "^$|^[0-9]{10}$", message = "Phone must be a 10-digit number")
    private String phone;

    private String department;
    private String year;
}

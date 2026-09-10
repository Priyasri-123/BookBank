package com.bookbank.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String department;
    private String year;
    private String registerNumber;
    private String role;
    private Boolean active;
    private LocalDateTime createdAt;
}

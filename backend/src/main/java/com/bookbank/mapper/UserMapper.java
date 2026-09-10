package com.bookbank.mapper;

import com.bookbank.dto.response.UserResponse;
import com.bookbank.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .department(u.getDepartment())
                .year(u.getYear())
                .registerNumber(u.getRegisterNumber())
                .role(u.getRole().name())
                .active(u.getActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}

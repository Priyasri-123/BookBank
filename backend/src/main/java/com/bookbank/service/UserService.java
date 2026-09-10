package com.bookbank.service;

import com.bookbank.dto.request.UpdateProfileRequest;
import com.bookbank.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAll();
    List<UserResponse> search(String keyword);
    UserResponse getById(Long id);
    UserResponse updateStatus(Long id, boolean active);
    UserResponse changeRole(Long id, String role);
    UserResponse updateProfile(Long id, UpdateProfileRequest request);
    void delete(Long id);
}

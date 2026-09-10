package com.bookbank.service.impl;

import com.bookbank.dto.request.UpdateProfileRequest;
import com.bookbank.dto.response.UserResponse;
import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.UserMapper;
import com.bookbank.repository.UserRepository;
import com.bookbank.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }

    @Override
    public List<UserResponse> search(String keyword) {
        return userRepository.search(keyword).stream().map(userMapper::toResponse).toList();
    }

    @Override
    public UserResponse getById(Long id) {
        return userMapper.toResponse(getUserOrThrow(id));
    }

    @Override
    public UserResponse updateStatus(Long id, boolean active) {
        User user = getUserOrThrow(id);
        user.setActive(active);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse changeRole(Long id, String role) {
        User user = getUserOrThrow(id);
        try {
            user.setRole(Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            throw new InvalidRequestException("Invalid role: " + role);
        }
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        User user = getUserOrThrow(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getYear() != null) {
            user.setYear(request.getYear());
        }
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    private User getUserOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}

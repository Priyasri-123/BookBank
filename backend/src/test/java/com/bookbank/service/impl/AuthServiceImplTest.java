package com.bookbank.service.impl;

import com.bookbank.dto.request.LoginRequest;
import com.bookbank.dto.request.RegisterRequest;
import com.bookbank.dto.response.AuthResponse;
import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import com.bookbank.exception.UnauthorizedException;
import com.bookbank.exception.UserAlreadyExistsException;
import com.bookbank.repository.UserRepository;
import com.bookbank.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setName("Test Student");
        registerRequest.setEmail("student@test.com");
        registerRequest.setPassword("password123");
    }

    @Test
    void register_createsNewStudentAccount_whenEmailIsFree() {
        when(userRepository.existsByEmail("student@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getRole()).isEqualTo("STUDENT");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_throwsException_whenEmailAlreadyExists() {
        when(userRepository.existsByEmail("student@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(UserAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_succeeds_withCorrectCredentials() {
        User user = User.builder()
                .id(1L).name("Test").email("student@test.com")
                .password("hashed").role(Role.STUDENT).active(true).build();

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("student@test.com");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), any())).thenReturn("mock-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertThat(response.getToken()).isEqualTo("mock-jwt-token");
        assertThat(response.getEmail()).isEqualTo("student@test.com");
    }

    @Test
    void login_throwsException_withWrongPassword() {
        User user = User.builder()
                .id(1L).name("Test").email("student@test.com")
                .password("hashed").role(Role.STUDENT).active(true).build();

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("student@test.com");
        loginRequest.setPassword("wrongpassword");

        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void login_throwsException_whenUserNotFound() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nobody@test.com");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(UnauthorizedException.class);
    }
}

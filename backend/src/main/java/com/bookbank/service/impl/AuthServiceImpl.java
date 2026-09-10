package com.bookbank.service.impl;

import com.bookbank.dto.request.ForgotPasswordRequest;
import com.bookbank.dto.request.LoginRequest;
import com.bookbank.dto.request.RegisterRequest;
import com.bookbank.dto.request.ResetPasswordRequest;
import com.bookbank.dto.request.VerifyOtpRequest;
import com.bookbank.dto.response.AuthResponse;
import com.bookbank.entity.PasswordResetToken;
import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.exception.UnauthorizedException;
import com.bookbank.exception.UserAlreadyExistsException;
import com.bookbank.repository.PasswordResetTokenRepository;
import com.bookbank.repository.UserRepository;
import com.bookbank.security.JwtUtil;
import com.bookbank.service.AuthService;
import com.bookbank.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("An account with this email already exists");
        }
        if (request.getRegisterNumber() != null && !request.getRegisterNumber().isBlank()
                && userRepository.existsByRegisterNumber(request.getRegisterNumber())) {
            throw new UserAlreadyExistsException("This register number is already used");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .department(request.getDepartment())
                .year(request.getYear())
                .registerNumber(request.getRegisterNumber())
                .role(Role.STUDENT)
                .active(true)
                .build();

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("Your account has been deactivated. Contact the administrator.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email"));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new UnauthorizedException("This account has been deactivated. Contact the administrator.");
        }

        int validityMinutes = 15;
        String otp = generateOtp();

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .token(otp)
                .expiryDate(LocalDateTime.now().plusMinutes(validityMinutes))
                .used(false)
                .attemptCount(0)
                .build();

        passwordResetTokenRepository.save(resetToken);
        emailService.sendPasswordResetOtp(user.getEmail(), otp, validityMinutes);
    }

    @Override
    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getOtp())
                .orElseThrow(() -> new InvalidRequestException("Invalid OTP"));

        if (!resetToken.getUser().getEmail().equals(request.getEmail())) {
            throw new InvalidRequestException("OTP does not match the requested email");
        }

        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new InvalidRequestException("This OTP has already been used");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidRequestException("OTP has expired. Please request a new one.");
        }

        int maxAttempts = 5;
        if (resetToken.getAttemptCount() >= maxAttempts) {
            throw new InvalidRequestException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        resetToken.setAttemptCount(resetToken.getAttemptCount() + 1);
        passwordResetTokenRepository.save(resetToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidRequestException("Passwords do not match");
        }

        if (request.getNewPassword().length() < 8) {
            throw new InvalidRequestException("Password must be at least 8 characters");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getOtp())
                .orElseThrow(() -> new InvalidRequestException("Invalid OTP"));

        if (!resetToken.getUser().getEmail().equals(request.getEmail())) {
            throw new InvalidRequestException("OTP does not match the requested email");
        }

        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new InvalidRequestException("This OTP has already been used");
        }

        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new InvalidRequestException("OTP has expired. Please request a new one.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        passwordResetTokenRepository.markAllUnusedAsUsed(user);
    }

    private String generateOtp() {
        StringBuilder otp = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(SECURE_RANDOM.nextInt(10));
        }
        return otp.toString();
    }
}
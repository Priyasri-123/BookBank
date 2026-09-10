package com.bookbank.service;

import com.bookbank.dto.request.LoginRequest;
import com.bookbank.dto.request.RegisterRequest;
import com.bookbank.dto.request.ForgotPasswordRequest;
import com.bookbank.dto.request.VerifyOtpRequest;
import com.bookbank.dto.request.ResetPasswordRequest;
import com.bookbank.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void verifyOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
}

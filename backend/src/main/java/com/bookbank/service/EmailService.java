package com.bookbank.service;

public interface EmailService {
    void sendPasswordResetOtp(String toEmail, String otp, int validityMinutes);
}
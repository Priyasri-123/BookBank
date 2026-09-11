package com.bookbank.service.impl;

import com.bookbank.exception.EmailSendException;
import com.bookbank.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp, int validityMinutes) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject("Book Bank - Password Reset OTP");
            helper.setText(buildOtpEmail(otp, validityMinutes), true);

            mailSender.send(message);
            log.info("Password reset OTP email sent to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset OTP email to {}: {}", toEmail, e.getMessage());
            throw new EmailSendException("Failed to send OTP email. Verify your SMTP configuration (MAIL_USERNAME and MAIL_PASSWORD environment variables must be set with a valid Gmail App Password).");
        } catch (MailException e) {
            log.error("Failed to send password reset OTP email to {}: {}", toEmail, e.getMessage());
            throw new EmailSendException("Failed to send OTP email. Verify your SMTP configuration (MAIL_USERNAME and MAIL_PASSWORD environment variables must be set with a valid Gmail App Password).");
        }
    }

    private String buildOtpEmail(String otp, int validityMinutes) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; border: 1px solid #e9ecef;">
                        <h2 style="color: #2c3e50; margin-bottom: 20px;">Book Bank - Password Reset</h2>
                        <p style="margin-bottom: 16px;">You requested to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
                        <div style="background-color: #fff; border: 2px solid #3498db; border-radius: 6px; padding: 20px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 4px; font-family: monospace;">%s</span>
                        </div>
                        <p style="margin-bottom: 16px;">This OTP is valid for <strong>%d minutes</strong>. Do not share it with anyone.</p>
                        <p style="margin-bottom: 16px; color: #6c757d; font-size: 14px;">If you didn't request this, please ignore this email or contact support.</p>
                        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 24px 0;">
                        <p style="margin: 0; color: #6c757d; font-size: 12px;">Book Bank Management System</p>
                    </div>
                </body>
                </html>
                """.formatted(otp, validityMinutes);
    }
}
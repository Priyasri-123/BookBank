package com.bookbank;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point of the Smart Book Bank Management System backend.
 * Run this class to start the Spring Boot application.
 */
@SpringBootApplication
@EnableScheduling // needed later for automatic overdue/fine checks
@EnableAsync       // for async email sending
public class BookBankApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookBankApplication.class, args);
    }
}

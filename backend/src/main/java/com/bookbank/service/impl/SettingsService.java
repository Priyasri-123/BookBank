package com.bookbank.service.impl;

import com.bookbank.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Reads configurable business rules from the system_settings table,
 * falling back to application.properties defaults if a row is missing.
 * This is what lets the admin change "fine per day" or "borrow period"
 * without a code change or redeploy.
 */
@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SystemSettingRepository settingRepository;

    public int getBorrowPeriodDays() {
        return getInt("BORROW_PERIOD_DAYS", 14);
    }

    public BigDecimal getFinePerDay() {
        return getBigDecimal("FINE_PER_DAY", BigDecimal.valueOf(5));
    }

    public int getReservationExpiryDays() {
        return getInt("RESERVATION_EXPIRY_DAYS", 3);
    }

    public int getMaxBooksPerStudent() {
        return getInt("MAX_BOOKS_PER_STUDENT", 3);
    }

    private int getInt(String key, int fallback) {
        return settingRepository.findById(key).map(s -> Integer.parseInt(s.getValue())).orElse(fallback);
    }

    private BigDecimal getBigDecimal(String key, BigDecimal fallback) {
        return settingRepository.findById(key).map(s -> new BigDecimal(s.getValue())).orElse(fallback);
    }
}

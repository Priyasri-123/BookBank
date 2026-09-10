package com.bookbank.config;

import com.bookbank.entity.Category;
import com.bookbank.entity.Role;
import com.bookbank.entity.SystemSetting;
import com.bookbank.entity.User;
import com.bookbank.repository.CategoryRepository;
import com.bookbank.repository.SystemSettingRepository;
import com.bookbank.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Runs once at application startup. Creates a default ADMIN account and
 * some starter categories/settings so the app is usable immediately,
 * without you having to manually insert SQL rows.
 *
 * Default admin login (CHANGE THE PASSWORD after first login):
 *   email:    admin@bookbank.com
 *   password: Admin@123
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedCategories();
        seedSettings();
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail("admin@bookbank.com")) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@bookbank.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .build();
            userRepository.save(admin);
        }
    }

    private void seedCategories() {
        List<String> defaults = List.of(
                "Programming", "Database", "Networking", "Artificial Intelligence",
                "Data Science", "Web Development", "Electronics", "Mathematics", "General"
        );
        for (String name : defaults) {
            if (!categoryRepository.existsByNameIgnoreCase(name)) {
                categoryRepository.save(Category.builder().name(name).build());
            }
        }
    }

    private void seedSettings() {
        saveIfAbsent("BORROW_PERIOD_DAYS", "14", "Number of days a book can be borrowed before it's due");
        saveIfAbsent("FINE_PER_DAY", "5", "Fine charged (in rupees) per day overdue");
        saveIfAbsent("RESERVATION_EXPIRY_DAYS", "3", "Days a reservation stays active once a copy becomes available");
        saveIfAbsent("MAX_BOOKS_PER_STUDENT", "3", "Maximum number of books a student can borrow at once");
    }

    private void saveIfAbsent(String key, String value, String description) {
        if (!systemSettingRepository.existsById(key)) {
            systemSettingRepository.save(new SystemSetting(key, value, description));
        }
    }
}

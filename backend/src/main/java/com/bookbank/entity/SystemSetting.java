package com.bookbank.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Simple key-value settings table so admins can tune business rules
 * (fine per day, borrow period, etc.) without redeploying the app.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @Column(name = "setting_key", length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 255)
    private String value;

    @Column(length = 255)
    private String description;
}

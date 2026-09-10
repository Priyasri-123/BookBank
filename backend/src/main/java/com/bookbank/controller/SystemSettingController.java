package com.bookbank.controller;

import com.bookbank.entity.SystemSetting;
import com.bookbank.repository.SystemSettingRepository;
import com.bookbank.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Settings", description = "Admin-configurable business rules (fine per day, borrow period, etc.)")
public class SystemSettingController {

    private final SystemSettingRepository systemSettingRepository;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAll() {
        return ResponseEntity.ok(systemSettingRepository.findAll());
    }

    @PutMapping("/{key}")
    public ResponseEntity<SystemSetting> update(@PathVariable String key, @RequestParam String value) {
        SystemSetting setting = systemSettingRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
        setting.setValue(value);
        return ResponseEntity.ok(systemSettingRepository.save(setting));
    }
}

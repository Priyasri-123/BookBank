package com.bookbank.controller;

import com.bookbank.dto.response.AdminDashboardResponse;
import com.bookbank.dto.response.LibrarianDashboardResponse;
import com.bookbank.dto.response.StudentDashboardResponse;
import com.bookbank.security.CurrentUserProvider;
import com.bookbank.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Role-specific summary statistics")
public class DashboardController {

    private final DashboardService dashboardService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> admin() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/librarian")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<LibrarianDashboardResponse> librarian() {
        return ResponseEntity.ok(dashboardService.getLibrarianDashboard());
    }

    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDashboardResponse> student() {
        return ResponseEntity.ok(dashboardService.getStudentDashboard(currentUserProvider.getCurrentUser()));
    }
}

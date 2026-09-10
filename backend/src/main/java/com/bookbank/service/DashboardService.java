package com.bookbank.service;

import com.bookbank.dto.response.AdminDashboardResponse;
import com.bookbank.dto.response.LibrarianDashboardResponse;
import com.bookbank.dto.response.StudentDashboardResponse;
import com.bookbank.entity.User;

public interface DashboardService {
    AdminDashboardResponse getAdminDashboard();
    LibrarianDashboardResponse getLibrarianDashboard();
    StudentDashboardResponse getStudentDashboard(User student);
}

package com.bookbank.controller;

import com.bookbank.entity.Notification;
import com.bookbank.security.CurrentUserProvider;
import com.bookbank.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications for the logged-in user")
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications() {
        return ResponseEntity.ok(notificationService.getMyNotifications(currentUserProvider.getCurrentUser()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount(currentUserProvider.getCurrentUser());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead() {
        notificationService.markAllRead(currentUserProvider.getCurrentUser());
        return ResponseEntity.noContent().build();
    }
}

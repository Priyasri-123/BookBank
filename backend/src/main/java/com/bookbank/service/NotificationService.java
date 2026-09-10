package com.bookbank.service;

import com.bookbank.entity.User;

import java.util.List;

public interface NotificationService {
    void notify(User user, String message);
    List<com.bookbank.entity.Notification> getMyNotifications(User user);
    long getUnreadCount(User user);
    void markAllRead(User user);
}

package com.bookbank.service;

import com.bookbank.entity.Notification;
import com.bookbank.entity.NotificationType;
import com.bookbank.entity.User;

import java.util.List;

public interface NotificationService {
    void notify(User user, String message);
    void notify(User user, String message, NotificationType type);
    List<Notification> getMyNotifications(User user);
    long getUnreadCount(User user);
    long getUnreadCount(User user, NotificationType type);
    void markAllRead(User user);
    void markRead(Long notificationId, User user);
    List<Notification> getMyNotifications(User user, NotificationType type);
}

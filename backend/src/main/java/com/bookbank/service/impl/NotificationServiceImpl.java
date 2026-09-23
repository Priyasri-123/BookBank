package com.bookbank.service.impl;

import com.bookbank.entity.Notification;
import com.bookbank.entity.NotificationType;
import com.bookbank.entity.User;
import com.bookbank.repository.NotificationRepository;
import com.bookbank.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public void notify(User user, String message) {
        notify(user, message, NotificationType.SYSTEM);
    }

    @Override
    public void notify(User user, String message, NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .read(false)
                .build();
        notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getMyNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Override
    public long getUnreadCount(User user, NotificationType type) {
        return notificationRepository.countByUserAndReadFalseAndType(user, type);
    }

    @Override
    public List<Notification> getMyNotifications(User user, NotificationType type) {
        return notificationRepository.findByUserAndTypeOrderByCreatedAtDesc(user, type);
    }

    @Override
    @Transactional
    public void markAllRead(User user) {
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void markRead(Long notificationId, User user) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }
}
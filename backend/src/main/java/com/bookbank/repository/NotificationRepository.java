package com.bookbank.repository;

import com.bookbank.entity.Notification;
import com.bookbank.entity.NotificationType;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    long countByUserAndReadFalse(User user);
    long countByUserAndReadFalseAndType(User user, NotificationType type);
    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type);
}
package com.bookbank.entity;

/**
 * Catalog of in-app notification types. Each type maps to a distinct user event
 * (borrow approved, book issued, book returned, book overdue, fine created,
 * fine paid, reservation fulfilled). The actual message text is composed by the
 * service layer; this enum only classifies the notification.
 */
public enum NotificationType {
    BORROW_REQUEST_APPROVED,
    BORROW_REQUEST_REJECTED,
    BOOK_ISSUED,
    BOOK_RETURNED,
    BOOK_OVERDUE,
    FINE_CREATED,
    FINE_PAID,
    RESERVATION_FULFILLED,
    SYSTEM
}
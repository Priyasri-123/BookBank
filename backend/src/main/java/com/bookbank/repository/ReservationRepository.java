package com.bookbank.repository;

import com.bookbank.entity.Book;
import com.bookbank.entity.Reservation;
import com.bookbank.entity.Reservation.ReservationStatus;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserOrderByReservationDateDesc(User user);
    List<Reservation> findByBookAndStatusOrderByReservationDateAsc(Book book, ReservationStatus status);
    Optional<Reservation> findFirstByBookAndStatusOrderByReservationDateAsc(Book book, ReservationStatus status);
    long countByStatus(ReservationStatus status);
    boolean existsByUserAndBookAndStatus(User user, Book book, ReservationStatus status);
}

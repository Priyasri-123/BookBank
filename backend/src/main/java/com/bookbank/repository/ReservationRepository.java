package com.bookbank.repository;

import com.bookbank.entity.Book;
import com.bookbank.entity.Reservation;
import com.bookbank.entity.Reservation.ReservationStatus;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserOrderByReservationDateDesc(User user);
    List<Reservation> findByBookAndStatusOrderByReservationDateAsc(Book book, ReservationStatus status);
    Optional<Reservation> findFirstByBookAndStatusOrderByReservationDateAsc(Book book, ReservationStatus status);
    long countByStatus(ReservationStatus status);
    boolean existsByUserAndBookAndStatus(User user, Book book, ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.book = :book AND r.status = 'ACTIVE' AND r.reservationDate <= :reservationDate")
    long countActiveBefore(@Param("book") Book book, @Param("reservationDate") LocalDateTime reservationDate);
}

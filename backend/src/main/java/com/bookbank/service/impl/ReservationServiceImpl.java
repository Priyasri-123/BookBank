package com.bookbank.service.impl;

import com.bookbank.dto.response.ReservationResponse;
import com.bookbank.entity.Book;
import com.bookbank.entity.Reservation;
import com.bookbank.entity.Reservation.ReservationStatus;
import com.bookbank.entity.User;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.exception.UnauthorizedException;
import com.bookbank.mapper.ReservationMapper;
import com.bookbank.repository.BookRepository;
import com.bookbank.repository.ReservationRepository;
import com.bookbank.service.NotificationService;
import com.bookbank.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Reservation queue: when a book has zero available copies, a student can
 * reserve it. When a copy is returned, returnBook() in BorrowTransactionService
 * checks hasActiveQueue() and, if true, holds the copy as RESERVED and calls
 * notifyNextInQueue() so the first person in line is told to come collect it.
 */
@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final ReservationMapper reservationMapper;
    private final SettingsService settingsService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReservationResponse reserve(User student, Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        if (book.getAvailableCopies() != null && book.getAvailableCopies() > 0) {
            throw new InvalidRequestException(
                    "'" + book.getTitle() + "' currently has copies available - borrow it directly instead");
        }

        if (reservationRepository.existsByUserAndBookAndStatus(student, book, ReservationStatus.ACTIVE)) {
            throw new InvalidRequestException("You already have an active reservation for this book");
        }

        Reservation reservation = Reservation.builder()
                .user(student)
                .book(book)
                .reservationDate(LocalDateTime.now())
                .expiryDate(LocalDateTime.now().plusDays(settingsService.getReservationExpiryDays()))
                .status(ReservationStatus.ACTIVE)
                .build();

        return reservationMapper.toResponse(reservationRepository.save(reservation));
    }

    @Override
    @Transactional
    public void cancel(Long reservationId, User requester) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with id: " + reservationId));

        boolean isOwner = reservation.getUser().getId().equals(requester.getId());
        boolean isStaff = requester.getRole().name().equals("ADMIN") || requester.getRole().name().equals("LIBRARIAN");
        if (!isOwner && !isStaff) {
            throw new UnauthorizedException("You can only cancel your own reservations");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);
    }

    @Override
    public List<ReservationResponse> getMyReservations(User user) {
        return reservationRepository.findByUserOrderByReservationDateDesc(user).stream()
                .map(reservationMapper::toResponse).toList();
    }

    @Override
    public List<ReservationResponse> getAll() {
        return reservationRepository.findAll().stream().map(reservationMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public void expireOldReservations() {
        List<Reservation> all = reservationRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        for (Reservation r : all) {
            if (r.getStatus() == ReservationStatus.ACTIVE && r.getExpiryDate() != null && r.getExpiryDate().isBefore(now)) {
                r.setStatus(ReservationStatus.EXPIRED);
            }
        }
        reservationRepository.saveAll(all);
    }

    @Override
    @Transactional
    public void notifyNextInQueue(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));

        Optional<Reservation> next = reservationRepository
                .findFirstByBookAndStatusOrderByReservationDateAsc(book, ReservationStatus.ACTIVE);

        if (next.isPresent()) {
            Reservation reservation = next.get();
            reservation.setStatus(ReservationStatus.FULFILLED);
            reservation.setExpiryDate(LocalDateTime.now().plusDays(settingsService.getReservationExpiryDays()));
            reservationRepository.save(reservation);

            notificationService.notify(reservation.getUser(),
                    "Good news! '" + book.getTitle() + "' is now available for you to collect. " +
                    "Please borrow it before " + reservation.getExpiryDate().toLocalDate());
        }
    }

    @Override
    public boolean hasActiveQueue(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        return !reservationRepository
                .findByBookAndStatusOrderByReservationDateAsc(book, ReservationStatus.ACTIVE)
                .isEmpty();
    }
}

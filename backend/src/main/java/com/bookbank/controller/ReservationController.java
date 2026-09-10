package com.bookbank.controller;

import com.bookbank.dto.request.ReservationRequestDto;
import com.bookbank.dto.response.ReservationResponse;
import com.bookbank.security.CurrentUserProvider;
import com.bookbank.service.ReservationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
@Tag(name = "Reservations", description = "Reserve books that currently have no available copies")
public class ReservationController {

    private final ReservationService reservationService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReservationResponse> reserve(@Valid @RequestBody ReservationRequestDto request) {
        var result = reservationService.reserve(currentUserProvider.getCurrentUser(), request.getBookId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAll() {
        var user = currentUserProvider.getCurrentUser();
        boolean isStaff = user.getRole().name().equals("ADMIN") || user.getRole().name().equals("LIBRARIAN");
        List<ReservationResponse> result = isStaff
                ? reservationService.getAll()
                : reservationService.getMyReservations(user);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        reservationService.cancel(id, currentUserProvider.getCurrentUser());
        return ResponseEntity.noContent().build();
    }
}

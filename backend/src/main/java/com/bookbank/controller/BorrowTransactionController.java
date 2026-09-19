package com.bookbank.controller;

import com.bookbank.dto.request.BorrowRequestDto;
import com.bookbank.dto.request.PayFineRequest;
import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.security.CurrentUserProvider;
import com.bookbank.service.BorrowTransactionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Borrowing", description = "Borrow requests, approvals, issuing, and returns")
public class BorrowTransactionController {

    private final BorrowTransactionService borrowTransactionService;
    private final CurrentUserProvider currentUserProvider;

    @PostMapping("/borrow-requests")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BorrowTransactionResponse> request(@Valid @RequestBody BorrowRequestDto request) {
        var result = borrowTransactionService.requestBorrow(currentUserProvider.getCurrentUser(), request.getBookId());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/borrow-requests")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<List<BorrowTransactionResponse>> getAllOrPending(
            @RequestParam(required = false) String status) {
        List<BorrowTransactionResponse> result = "PENDING".equalsIgnoreCase(status)
                ? borrowTransactionService.getPending()
                : borrowTransactionService.getAll();
        return ResponseEntity.ok(result);
    }

    @PutMapping("/borrow-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<BorrowTransactionResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(borrowTransactionService.approve(id));
    }

    @PutMapping("/borrow-requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<BorrowTransactionResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(borrowTransactionService.reject(id));
    }

    @PutMapping("/borrow-transactions/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN','STUDENT')")
    public ResponseEntity<BorrowTransactionResponse> returnBook(@PathVariable Long id) {
        return ResponseEntity.ok(borrowTransactionService.returnBook(currentUserProvider.getCurrentUser(), id));
    }

    @GetMapping("/borrow-transactions/overdue")
    @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<List<BorrowTransactionResponse>> getOverdue() {
        return ResponseEntity.ok(borrowTransactionService.getOverdue());
    }

    @GetMapping("/borrow-transactions/my-history")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<BorrowTransactionResponse>> getMyHistory() {
        return ResponseEntity.ok(borrowTransactionService.getMyHistory(currentUserProvider.getCurrentUser()));
    }

    @GetMapping("/borrow-transactions/my-current")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<BorrowTransactionResponse>> getMyCurrent() {
        return ResponseEntity.ok(borrowTransactionService.getMyCurrentlyBorrowed(currentUserProvider.getCurrentUser()));
    }

    @GetMapping("/borrow-transactions/my-fines")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<BorrowTransactionResponse>> getMyUnpaidFines() {
        return ResponseEntity.ok(borrowTransactionService.getMyUnpaidFines(currentUserProvider.getCurrentUser()));
    }

    @PutMapping("/borrow-transactions/{id}/pay-fine")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BorrowTransactionResponse> payFine(
            @PathVariable Long id,
            @Valid @RequestBody PayFineRequest request) {
        return ResponseEntity.ok(borrowTransactionService.payFine(currentUserProvider.getCurrentUser(), id, request.getTxnId()));
    }
}

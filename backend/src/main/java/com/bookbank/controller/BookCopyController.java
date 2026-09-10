package com.bookbank.controller;

import com.bookbank.dto.request.BookCopyRequest;
import com.bookbank.dto.response.BookCopyResponse;
import com.bookbank.service.BookCopyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/book-copies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
@Tag(name = "Book Copies", description = "Manage individual physical copies of a book")
public class BookCopyController {

    private final BookCopyService bookCopyService;

    @PostMapping
    @Operation(summary = "Add a new physical copy of a book")
    public ResponseEntity<BookCopyResponse> addCopy(@Valid @RequestBody BookCopyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookCopyService.addCopy(request));
    }

    @PutMapping("/{copyId}/status")
    @Operation(summary = "Update a copy's status (AVAILABLE, LOST, DAMAGED, etc.)")
    public ResponseEntity<BookCopyResponse> updateStatus(@PathVariable Long copyId, @RequestParam String status) {
        return ResponseEntity.ok(bookCopyService.updateStatus(copyId, status));
    }

    @DeleteMapping("/{copyId}")
    @Operation(summary = "Remove a copy from circulation")
    public ResponseEntity<Void> deleteCopy(@PathVariable Long copyId) {
        bookCopyService.deleteCopy(copyId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/book/{bookId}")
    @Operation(summary = "List all copies for a given book")
    public ResponseEntity<List<BookCopyResponse>> getCopiesForBook(@PathVariable Long bookId) {
        return ResponseEntity.ok(bookCopyService.getCopiesForBook(bookId));
    }
}

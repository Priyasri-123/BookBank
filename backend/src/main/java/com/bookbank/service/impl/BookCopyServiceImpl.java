package com.bookbank.service.impl;

import com.bookbank.dto.request.BookCopyRequest;
import com.bookbank.dto.response.BookCopyResponse;
import com.bookbank.entity.Book;
import com.bookbank.entity.BookCopy;
import com.bookbank.entity.BookCopy.CopyStatus;
import com.bookbank.exception.InvalidRequestException;
import com.bookbank.exception.ResourceNotFoundException;
import com.bookbank.mapper.BookCopyMapper;
import com.bookbank.repository.BookCopyRepository;
import com.bookbank.repository.BookRepository;
import com.bookbank.service.BookCopyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Manages individual physical copies of a book.
 * Whenever a copy's status changes, this service keeps Book.availableCopies
 * accurate so search results always reflect real-time availability.
 */
@Service
@RequiredArgsConstructor
public class BookCopyServiceImpl implements BookCopyService {

    private final BookCopyRepository bookCopyRepository;
    private final BookRepository bookRepository;
    private final BookCopyMapper bookCopyMapper;

    @Override
    @Transactional
    public BookCopyResponse addCopy(BookCopyRequest request) {
        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + request.getBookId()));

        if (bookCopyRepository.existsByCopyCode(request.getCopyCode())) {
            throw new InvalidRequestException("Copy code '" + request.getCopyCode() + "' is already in use");
        }

        BookCopy copy = BookCopy.builder()
                .book(book)
                .copyCode(request.getCopyCode())
                .status(CopyStatus.AVAILABLE)
                .condition(request.getCondition() != null ? request.getCondition() : "NEW")
                .purchaseDate(request.getPurchaseDate())
                .build();
        copy = bookCopyRepository.save(copy);

        book.setTotalCopies(book.getTotalCopies() + 1);
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        return bookCopyMapper.toResponse(copy);
    }

    @Override
    @Transactional
    public BookCopyResponse updateStatus(Long copyId, String status) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Book copy not found with id: " + copyId));

        CopyStatus newStatus;
        try {
            newStatus = CopyStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new InvalidRequestException("Invalid copy status: " + status);
        }

        boolean wasAvailable = copy.getStatus() == CopyStatus.AVAILABLE;
        boolean willBeAvailable = newStatus == CopyStatus.AVAILABLE;

        copy.setStatus(newStatus);
        bookCopyRepository.save(copy);

        if (wasAvailable != willBeAvailable) {
            Book book = copy.getBook();
            book.setAvailableCopies(book.getAvailableCopies() + (willBeAvailable ? 1 : -1));
            bookRepository.save(book);
        }

        return bookCopyMapper.toResponse(copy);
    }

    @Override
    @Transactional
    public void deleteCopy(Long copyId) {
        BookCopy copy = bookCopyRepository.findById(copyId)
                .orElseThrow(() -> new ResourceNotFoundException("Book copy not found with id: " + copyId));

        if (copy.getStatus() == CopyStatus.ISSUED) {
            throw new InvalidRequestException("Cannot delete a copy that is currently issued to a student");
        }

        Book book = copy.getBook();
        book.setTotalCopies(Math.max(0, book.getTotalCopies() - 1));
        if (copy.getStatus() == CopyStatus.AVAILABLE) {
            book.setAvailableCopies(Math.max(0, book.getAvailableCopies() - 1));
        }
        bookRepository.save(book);
        bookCopyRepository.delete(copy);
    }

    @Override
    public List<BookCopyResponse> getCopiesForBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + bookId));
        return bookCopyRepository.findByBook(book).stream().map(bookCopyMapper::toResponse).toList();
    }
}

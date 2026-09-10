package com.bookbank.service;

import com.bookbank.dto.request.BookRequest;
import com.bookbank.dto.response.BookResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookService {
    BookResponse create(BookRequest request);
    BookResponse update(Long id, BookRequest request);
    void delete(Long id); // soft delete
    BookResponse getById(Long id);
    Page<BookResponse> search(String keyword, Pageable pageable);
    Page<BookResponse> getAll(Pageable pageable);
}

package com.bookbank.service;

import com.bookbank.dto.request.BookCopyRequest;
import com.bookbank.dto.response.BookCopyResponse;

import java.util.List;

public interface BookCopyService {
    BookCopyResponse addCopy(BookCopyRequest request);
    BookCopyResponse updateStatus(Long copyId, String status);
    void deleteCopy(Long copyId);
    List<BookCopyResponse> getCopiesForBook(Long bookId);
}

package com.bookbank.repository;

import com.bookbank.entity.Book;
import com.bookbank.entity.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    List<BookCopy> findByBook(Book book);
    List<BookCopy> findByBookAndStatus(Book book, BookCopy.CopyStatus status);
    Optional<BookCopy> findFirstByBookAndStatus(Book book, BookCopy.CopyStatus status);
    boolean existsByCopyCode(String copyCode);
    long countByStatus(BookCopy.CopyStatus status);
    long countByBookAndStatus(Book book, BookCopy.CopyStatus status);
}

package com.bookbank.repository;

import com.bookbank.entity.Book;
import com.bookbank.entity.BookCopy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    List<BookCopy> findByBook(Book book);
    List<BookCopy> findByBookAndStatus(Book book, BookCopy.CopyStatus status);
    Optional<BookCopy> findFirstByBookAndStatus(Book book, BookCopy.CopyStatus status);
    boolean existsByCopyCode(String copyCode);
    long countByStatus(BookCopy.CopyStatus status);
    long countByBookAndStatus(Book book, BookCopy.CopyStatus status);

    @Query("SELECT COUNT(bc) FROM BookCopy bc WHERE bc.book.id = :bookId AND bc.status = :status")
    long countByBookIdAndStatus(@Param("bookId") Long bookId, @Param("status") BookCopy.CopyStatus status);
}

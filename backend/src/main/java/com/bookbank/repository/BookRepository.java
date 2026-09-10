package com.bookbank.repository;

import com.bookbank.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {

    boolean existsByIsbn(String isbn);

    @Query("SELECT b FROM Book b WHERE b.isDeleted = false AND (" +
           "LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.isbn) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.author.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.publisher.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.category.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Book> search(@Param("keyword") String keyword, Pageable pageable);

    Page<Book> findByIsDeletedFalse(Pageable pageable);

    long countByIsDeletedFalse();

    @Query("SELECT COALESCE(SUM(b.availableCopies), 0) FROM Book b WHERE b.isDeleted = false")
    long sumAvailableCopies();

    @Query("SELECT COALESCE(SUM(b.totalCopies), 0) FROM Book b WHERE b.isDeleted = false")
    long sumTotalCopies();
}

package com.bookbank.repository;

import com.bookbank.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Author> findByNameIgnoreCase(String name);
}

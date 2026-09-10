package com.bookbank.repository;

import com.bookbank.entity.Publisher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PublisherRepository extends JpaRepository<Publisher, Long> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Publisher> findByNameIgnoreCase(String name);
}

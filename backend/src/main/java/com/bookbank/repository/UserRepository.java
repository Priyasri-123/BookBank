package com.bookbank.repository;

import com.bookbank.entity.Role;
import com.bookbank.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRegisterNumber(String registerNumber);
    List<User> findByRole(Role role);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.registerNumber) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> search(String keyword);

    long countByRole(Role role);
}

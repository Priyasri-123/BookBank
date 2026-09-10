package com.bookbank.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "book_copies", uniqueConstraints = {
        @UniqueConstraint(name = "uk_copy_code", columnNames = "copy_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookCopy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(name = "copy_code", nullable = false, length = 30)
    private String copyCode; // e.g. BK001

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private CopyStatus status = CopyStatus.AVAILABLE;

    @Column(length = 30)
    private String condition; // NEW, GOOD, WORN, DAMAGED

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    public enum CopyStatus {
        AVAILABLE, ISSUED, RESERVED, LOST, DAMAGED
    }
}

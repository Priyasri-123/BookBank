package com.bookbank.mapper;

import com.bookbank.dto.response.BookResponse;
import com.bookbank.entity.Book;
import org.springframework.stereotype.Component;

@Component
public class BookMapper {
    public BookResponse toResponse(Book b) {
        return BookResponse.builder()
                .id(b.getId())
                .isbn(b.getIsbn())
                .title(b.getTitle())
                .description(b.getDescription())
                .authorName(b.getAuthor() != null ? b.getAuthor().getName() : null)
                .authorId(b.getAuthor() != null ? b.getAuthor().getId() : null)
                .publisherName(b.getPublisher() != null ? b.getPublisher().getName() : null)
                .publisherId(b.getPublisher() != null ? b.getPublisher().getId() : null)
                .categoryName(b.getCategory() != null ? b.getCategory().getName() : null)
                .categoryId(b.getCategory() != null ? b.getCategory().getId() : null)
                .language(b.getLanguage())
                .edition(b.getEdition())
                .publicationYear(b.getPublicationYear())
                .totalCopies(b.getTotalCopies())
                .availableCopies(b.getAvailableCopies())
                .imageUrl(b.getImageUrl())
                .build();
    }
}

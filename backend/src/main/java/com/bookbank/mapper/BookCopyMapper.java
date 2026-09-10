package com.bookbank.mapper;

import com.bookbank.dto.response.BookCopyResponse;
import com.bookbank.entity.BookCopy;
import org.springframework.stereotype.Component;

@Component
public class BookCopyMapper {
    public BookCopyResponse toResponse(BookCopy c) {
        return BookCopyResponse.builder()
                .id(c.getId())
                .bookId(c.getBook().getId())
                .bookTitle(c.getBook().getTitle())
                .copyCode(c.getCopyCode())
                .status(c.getStatus().name())
                .condition(c.getCondition())
                .purchaseDate(c.getPurchaseDate())
                .build();
    }
}

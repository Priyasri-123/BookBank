package com.bookbank.mapper;

import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.entity.BorrowTransaction;
import org.springframework.stereotype.Component;

@Component
public class BorrowTransactionMapper {
    public BorrowTransactionResponse toResponse(BorrowTransaction t) {
        return BorrowTransactionResponse.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .userName(t.getUser().getName())
                .bookCopyId(t.getBookCopy().getId())
                .copyCode(t.getBookCopy().getCopyCode())
                .bookTitle(t.getBookCopy().getBook().getTitle())
                .requestDate(t.getRequestDate())
                .issueDate(t.getIssueDate())
                .dueDate(t.getDueDate())
                .returnDate(t.getReturnDate())
                .status(t.getStatus().name())
                .fineAmount(t.getFineAmount())
                .finePaid(t.getFinePaid())
                .build();
    }
}

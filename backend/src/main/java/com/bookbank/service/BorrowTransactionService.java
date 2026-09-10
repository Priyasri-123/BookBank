package com.bookbank.service;

import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.entity.User;

import java.util.List;

public interface BorrowTransactionService {
    BorrowTransactionResponse requestBorrow(User student, Long bookId);
    BorrowTransactionResponse approve(Long transactionId);
    BorrowTransactionResponse reject(Long transactionId);
    BorrowTransactionResponse returnBook(Long transactionId);
    List<BorrowTransactionResponse> getAll();
    List<BorrowTransactionResponse> getPending();
    List<BorrowTransactionResponse> getMyHistory(User user);
    List<BorrowTransactionResponse> getMyCurrentlyBorrowed(User user);
    List<BorrowTransactionResponse> getOverdue();
    void refreshOverdueStatuses(); // scheduled job hook
    BorrowTransactionResponse autoApprovePendingRequest(Long transactionId);
}

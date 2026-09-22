package com.bookbank.service;

import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.entity.User;

import java.util.List;

public interface BorrowTransactionService {
    BorrowTransactionResponse requestBorrow(User student, Long bookId);
    BorrowTransactionResponse approve(Long transactionId);
    BorrowTransactionResponse reject(Long transactionId);
    BorrowTransactionResponse returnBook(User user, Long transactionId);
    List<BorrowTransactionResponse> getAll();
    List<BorrowTransactionResponse> getPending();
    List<BorrowTransactionResponse> getMyHistory(User user);
    List<BorrowTransactionResponse> getMyCurrentlyBorrowed(User user);
    List<BorrowTransactionResponse> getMyFines(User user);

    List<BorrowTransactionResponse> getMyUnpaidFines(User user);

    java.math.BigDecimal getUnpaidFineTotal();

    java.math.BigDecimal getUnpaidFineTotal(User user);
    List<BorrowTransactionResponse> getAdminFines(String paymentStatus, String keyword);
    List<BorrowTransactionResponse> getOverdue();
    void refreshOverdueStatuses(); // scheduled job hook
    BorrowTransactionResponse autoApprovePendingRequest(Long transactionId);
    BorrowTransactionResponse payFine(User student, Long transactionId, String txnId);

    com.bookbank.dto.response.StudentLibrarySummaryResponse getStudentLibrarySummary(Long studentId);
}

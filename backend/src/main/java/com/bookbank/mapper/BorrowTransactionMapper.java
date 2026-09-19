package com.bookbank.mapper;

import com.bookbank.dto.response.BorrowTransactionResponse;
import com.bookbank.entity.BorrowTransaction;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class BorrowTransactionMapper {

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal DEFAULT_FINE_PER_DAY = BigDecimal.valueOf(5);

    public BorrowTransactionResponse toResponse(BorrowTransaction transaction) {
        return toResponse(transaction, null, null, null);
    }

    public BorrowTransactionResponse toResponse(
            BorrowTransaction transaction,
            BigDecimal finePerDay,
            Long overdueDays,
            BigDecimal calculatedFineAmount) {
        BigDecimal rate = finePerDay == null ? DEFAULT_FINE_PER_DAY : finePerDay;
        Long days = overdueDays == null ? calculateOverdueDays(transaction) : overdueDays;
        BigDecimal calculatedFine = calculatedFineAmount == null
                ? calculateFineAmount(transaction, rate, days)
                : calculatedFineAmount;
        BigDecimal recordedFine = transaction.getFineAmount();
        BigDecimal fineAmount = recordedFine != null && recordedFine.compareTo(ZERO) > 0
                ? recordedFine
                : calculatedFine;
        BigDecimal paidAmount = transaction.getFinePaidAmount();
        if (paidAmount == null) {
            paidAmount = Boolean.TRUE.equals(transaction.getFinePaid()) && fineAmount.compareTo(ZERO) > 0
                    ? fineAmount
                    : ZERO;
        }
        BigDecimal fineAmountDue = fineAmount.compareTo(ZERO) <= 0
                ? ZERO
                : fineAmount.subtract(paidAmount).max(ZERO);
        boolean fullyPaid = fineAmount.compareTo(ZERO) > 0 && fineAmountDue.compareTo(ZERO) == 0;
        String paymentStatus = fineAmount.compareTo(ZERO) <= 0
                ? "NONE"
                : fineAmountDue.compareTo(ZERO) == 0
                    ? "PAID"
                    : paidAmount.compareTo(ZERO) > 0 ? "PARTIALLY_PAID" : "UNPAID";

        return BorrowTransactionResponse.builder()
                .id(transaction.getId())
                .userId(transaction.getUser().getId())
                .userName(transaction.getUser().getName())
                .bookCopyId(transaction.getBookCopy().getId())
                .copyCode(transaction.getBookCopy().getCopyCode())
                .bookTitle(transaction.getBookCopy().getBook().getTitle())
                .requestDate(transaction.getRequestDate())
                .issueDate(transaction.getIssueDate())
                .dueDate(transaction.getDueDate())
                .returnDate(transaction.getReturnDate())
                .status(transaction.getStatus().name())
                .fineAmount(fineAmount)
                .fineAmountDue(fineAmountDue)
                .finePaid(transaction.getFinePaid())
                .finePaidAmount(paidAmount)
                .finePaymentTxnId(transaction.getFinePaymentTxnId())
                .finePaymentDate(transaction.getFinePaymentDate())
                .overdueDays(days)
                .finePerDay(rate)
                .build();
    }

    public Long calculateOverdueDays(BorrowTransaction transaction) {
        return calculateOverdueDays(transaction, LocalDate.now());
    }

    public Long calculateOverdueDays(BorrowTransaction transaction, LocalDate now) {
        if (transaction.getDueDate() == null) return 0L;
        LocalDate endDate = transaction.getReturnDate() == null
                ? now
                : transaction.getReturnDate().toLocalDate();
        if (endDate.isBefore(transaction.getDueDate()) || endDate.isEqual(transaction.getDueDate())) {
            return 0L;
        }
        return ChronoUnit.DAYS.between(transaction.getDueDate(), endDate);
    }

    public BigDecimal calculateFineAmount(BorrowTransaction transaction, BigDecimal finePerDay, LocalDate now) {
        return calculateFineAmount(transaction, finePerDay, calculateOverdueDays(transaction, now));
    }

    public BigDecimal calculateFineAmount(BorrowTransaction transaction, BigDecimal finePerDay, Long overdueDays) {
        if (transaction.getStatus() == BorrowTransaction.BorrowStatus.RETURNED
                && transaction.getFineAmount() != null
                && transaction.getFineAmount().compareTo(ZERO) > 0) {
            return transaction.getFineAmount();
        }
        if (overdueDays != null && overdueDays > 0) {
            return finePerDay.multiply(BigDecimal.valueOf(overdueDays));
        }
        return ZERO;
    }
}

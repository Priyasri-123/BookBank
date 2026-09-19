package com.bookbank.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PayFineRequest {
    @NotBlank(message = "Transaction ID is required")
    private String txnId;
}

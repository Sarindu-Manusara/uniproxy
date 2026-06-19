package com.example.uniproxy.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TransactionResponse {
    private String paymentId;
    private BigDecimal amount;
    private String status;
    private LocalDateTime createdAt;
}
package com.example.uniproxy.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String paymentId; // The ID from NOWPayments
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String status; // PENDING, FINISHED, FAILED
    private String paymentPurpose;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String purchasePayload;

    private String providerOrderId;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}

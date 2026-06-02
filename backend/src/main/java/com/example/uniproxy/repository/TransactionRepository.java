package com.example.uniproxy.repository;

import com.example.uniproxy.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByPaymentId(String paymentId);
}
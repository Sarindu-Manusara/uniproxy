package com.example.uniproxy.controller;

import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import com.example.uniproxy.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/create")
    public ResponseEntity<String> create(@RequestParam BigDecimal amount) {
        // Get the logged-in user's username from the JWT token
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            return ResponseEntity.ok(paymentService.createPayment(user, amount));
        } catch (IllegalStateException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        }
    }
    @PostMapping("/webhook")
    public void handleWebhook(@RequestBody Map<String, Object> payload) {
        paymentService.processWebhook(payload);
    }
    @PostMapping("/create-account")
    public ResponseEntity<String> createNowPaymentsAccount() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // PaymentService එක හරහා NOWPayments API එක call කරනවා
        try {
            return ResponseEntity.ok(paymentService.createNowPaymentsUser(user));
        } catch (IllegalStateException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        }
    }
}

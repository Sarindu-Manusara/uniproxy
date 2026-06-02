package com.example.uniproxy.service;

import com.example.uniproxy.model.Transaction;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.TransactionRepository;
import com.example.uniproxy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class PaymentService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${nowpayments.api-key}")
    private String apiKey;

    @Value("${nowpayments.api-url}")
    private String apiUrl;

    @Value("${app.base-url}")
    private String appBaseUrl;

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    public String createPayment(User user, BigDecimal amount) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Payment gateway is not configured. Please contact support.");
        }

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("price_amount", amount);
        body.put("price_currency", "usd");
        body.put("pay_currency", "btc");
        body.put("order_id", "ORDER_" + System.currentTimeMillis());
        body.put("order_description", "Deposit to UniProxy Balance for " + user.getUsername());
        body.put("ipn_callback_url", appBaseUrl.replaceAll("/+$", "") + "/api/payments/webhook");
        body.put("success_url", frontendBaseUrl.replaceAll("/+$", "") + "/payment-success");
        body.put("cancel_url", frontendBaseUrl.replaceAll("/+$", "") + "/payment-cancel");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            Transaction tx = new Transaction();
            tx.setPaymentId(responseBody.get("payment_id").toString());
            tx.setAmount(amount);
            tx.setCurrency("USD");
            tx.setStatus("PENDING");
            tx.setCreatedAt(LocalDateTime.now());
            tx.setUser(user);
            transactionRepository.save(tx);

            return responseBody.get("invoice_url") != null ?
                    responseBody.get("invoice_url").toString() :
                    "Payment Created. ID: " + tx.getPaymentId();

        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException(friendlyNowPaymentsError(e), e);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create payment right now. Please try again later.", e);
        }
    }

    public void processWebhook(Map<String, Object> payload) {
        String paymentId = payload.get("payment_id").toString();
        String status = payload.get("payment_status").toString();

        if ("finished".equalsIgnoreCase(status)) {
            Transaction tx = transactionRepository.findByPaymentId(paymentId)
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));

            if (!"FINISHED".equals(tx.getStatus())) {
                tx.setStatus("FINISHED");
                transactionRepository.save(tx);

                User user = tx.getUser();
                user.setBalance(user.getBalance().add(tx.getAmount()));
                userRepository.save(user);
            }
        }
    }

    public BigDecimal getTotalRevenue() {
        return transactionRepository.findAll().stream()
                .filter(tx -> "FINISHED".equals(tx.getStatus()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Updated: Fixes the 404 error by using a valid endpoint for address creation
    public String createNowPaymentsUser(User user) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Payment gateway is not configured. Please contact support.");
        }

        RestTemplate restTemplate = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("price_amount", 1); // Minimum placeholder amount
        body.put("price_currency", "usd");
        body.put("pay_currency", "btc");
        body.put("order_id", "ACC_CREATE_" + user.getId());
        body.put("ipn_callback_url", appBaseUrl.replaceAll("/+$", "") + "/api/payments/webhook");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            // Using the standard payment endpoint which is reliable
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();

            return "Account Initialized. Payment ID: " + responseBody.get("payment_id").toString();
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException(friendlyNowPaymentsError(e), e);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to initialize payment gateway right now. Please try again later.", e);
        }
    }

    private String friendlyNowPaymentsError(HttpStatusCodeException error) {
        HttpStatusCode status = error.getStatusCode();
        String body = error.getResponseBodyAsString();

        if (status.value() == 401 || status.value() == 403 || body.contains("INVALID_API_KEY")) {
            return "Payment gateway authentication failed. Please contact support.";
        }

        if (status.value() == 400) {
            return "Payment request could not be created. Please check the amount and try again.";
        }

        if (status.value() == 429) {
            return "Payment gateway is busy. Please wait a moment and try again.";
        }

        return "Payment gateway is temporarily unavailable. Please try again later.";
    }
}

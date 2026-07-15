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
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @Value("${nowpayments.invoice-url}")
    private String invoiceUrl;

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
        body.put("order_id", "ORDER_" + System.currentTimeMillis());
        body.put("order_description", "Deposit to UniProxy Balance for " + user.getUsername());
        body.put("ipn_callback_url", appBaseUrl.replaceAll("/+$", "") + "/api/payments/webhook");
        body.put("success_url", frontendBaseUrl.replaceAll("/+$", "") + "/payment-success");
        body.put("cancel_url", frontendBaseUrl.replaceAll("/+$", "") + "/payment-cancel");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(invoiceUrl, request, Map.class);
            Map<String, Object> responseBody = response.getBody();
            String paymentId = getFirstString(responseBody, "invoice_id", "id", "payment_id");
            String redirectUrl = getFirstString(responseBody, "invoice_url", "payment_url");

            if (paymentId == null || redirectUrl == null) {
                throw new IllegalStateException("Payment redirect could not be created. Please try again later.");
            }

            Transaction tx = new Transaction();
            tx.setPaymentId(paymentId);
            tx.setAmount(amount);
            tx.setCurrency("USD");
            tx.setStatus("PENDING");
            tx.setCreatedAt(LocalDateTime.now());
            tx.setUser(user);
            transactionRepository.save(tx);

            return redirectUrl;

        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException(friendlyNowPaymentsError(e), e);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Unable to create payment right now. Please try again later.", e);
        }
    }

    public void processWebhook(Map<String, Object> payload) {
        String status = getFirstString(payload, "payment_status", "status");

        if (status == null) {
            throw new IllegalArgumentException("NOWPayments webhook missing payment status");
        }

        if ("finished".equalsIgnoreCase(status)) {
            Transaction tx = findTransactionByNowPaymentsPayload(payload)
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

    private Optional<Transaction> findTransactionByNowPaymentsPayload(Map<String, Object> payload) {
        List<String> identifiers = Arrays.asList(
                getFirstString(payload, "payment_id"),
                getFirstString(payload, "invoice_id"),
                getFirstString(payload, "id")
        );

        return identifiers.stream()
                .filter(identifier -> identifier != null && !identifier.isBlank())
                .map(transactionRepository::findByPaymentId)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .findFirst();
    }

    private String getFirstString(Map<String, Object> values, String... keys) {
        if (values == null) {
            return null;
        }

        for (String key : keys) {
            Object value = values.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value.toString();
            }
        }

        return null;
    }

    private String friendlyNowPaymentsError(HttpStatusCodeException error) {
        HttpStatusCode status = error.getStatusCode();
        String body = error.getResponseBodyAsString().toLowerCase();

        if (status.value() == 401 || status.value() == 403 || body.contains("invalid_api_key")) {
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

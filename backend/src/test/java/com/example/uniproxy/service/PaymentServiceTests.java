package com.example.uniproxy.service;

import com.example.uniproxy.model.Transaction;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.TransactionRepository;
import com.example.uniproxy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PaymentServiceTests {
    private final TransactionRepository transactions = mock(TransactionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ProxyService proxies = mock(ProxyService.class);
    private final RestTemplate restTemplate = mock(RestTemplate.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final PaymentService service = new PaymentService();

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "transactionRepository", transactions);
        ReflectionTestUtils.setField(service, "userRepository", users);
        ReflectionTestUtils.setField(service, "proxyService", proxies);
        ReflectionTestUtils.setField(service, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(service, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(service, "apiKey", "test-api-key");
        ReflectionTestUtils.setField(service, "invoiceUrl", "https://api.nowpayments.test/v1/invoice");
        ReflectionTestUtils.setField(service, "ipnSecret", "test-ipn-secret");
        ReflectionTestUtils.setField(service, "appBaseUrl", "https://api.uniproxy.test");
        ReflectionTestUtils.setField(service, "frontendBaseUrl", "https://uniproxy.test");
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void createsAPlanInvoiceAtTheServerQuotedPrice() {
        User user = user("buyer", "0.00");
        Map<String, Object> purchase = Map.of(
                "packageId", "dc-250",
                "proxyType", "DatacenterP",
                "countryProxies", Map.of("US", 250)
        );
        when(proxies.quoteProxyPurchase(purchase)).thenReturn(new BigDecimal("18.50"));
        when(restTemplate.postForEntity(
                eq("https://api.nowpayments.test/v1/invoice"),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(ResponseEntity.ok(Map.of(
                "id", "invoice-123",
                "invoice_url", "https://nowpayments.test/invoice-123"
        )));

        String redirect = service.createProxyPurchasePayment(user, purchase);

        assertEquals("https://nowpayments.test/invoice-123", redirect);
        ArgumentCaptor<HttpEntity<Map<String, Object>>> invoiceCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(
                eq("https://api.nowpayments.test/v1/invoice"),
                invoiceCaptor.capture(),
                eq(Map.class)
        );
        Map<String, Object> invoice = invoiceCaptor.getValue().getBody();
        assertNotNull(invoice);
        assertEquals(new BigDecimal("18.50"), invoice.get("price_amount"));
        assertTrue(invoice.get("order_id").toString().startsWith("PROXY_"));

        ArgumentCaptor<Transaction> transactionCaptor = ArgumentCaptor.forClass(Transaction.class);
        verify(transactions, times(2)).save(transactionCaptor.capture());
        Transaction transaction = transactionCaptor.getAllValues().get(1);
        assertEquals("PROXY_PURCHASE", transaction.getPaymentPurpose());
        assertEquals("invoice-123", transaction.getPaymentId());
        assertEquals(invoice.get("order_id"), transaction.getOrderId());
        assertTrue(transaction.getPurchasePayload().contains("dc-250"));
    }

    @Test
    void finishedPlanWebhookFulfillsWithoutCreditingBalance() {
        User user = user("buyer", "4.00");
        Transaction transaction = transaction(user, "PROXY_PURCHASE");
        transaction.setPurchasePayload("{\"packageId\":\"dc-250\",\"proxyType\":\"DatacenterP\"}");
        when(transactions.findByOrderId("PROXY_order-1")).thenReturn(Optional.of(transaction));
        when(proxies.purchaseProxyWithCrypto(eq(user), any(), eq(new BigDecimal("18.50"))))
                .thenReturn(Map.of("orderId", "cat-order-9"));
        Map<String, Object> payload = Map.of(
                "order_id", "PROXY_order-1",
                "payment_status", "finished"
        );

        service.processWebhook(payload, signature(payload));

        verify(proxies).purchaseProxyWithCrypto(eq(user), any(), eq(new BigDecimal("18.50")));
        verify(users, never()).save(any());
        assertEquals(new BigDecimal("4.00"), user.getBalance());
        assertEquals("FINISHED", transaction.getStatus());
        assertEquals("cat-order-9", transaction.getProviderOrderId());
        assertNotNull(transaction.getFinishedAt());
    }

    @Test
    void repeatedFinishedWebhookDoesNotFulfillTwice() {
        User user = user("buyer", "4.00");
        Transaction transaction = transaction(user, "PROXY_PURCHASE");
        transaction.setStatus("FINISHED");
        when(transactions.findByOrderId("PROXY_order-1")).thenReturn(Optional.of(transaction));
        Map<String, Object> payload = Map.of(
                "order_id", "PROXY_order-1",
                "payment_status", "finished"
        );

        service.processWebhook(payload, signature(payload));

        verify(proxies, never()).purchaseProxyWithCrypto(any(), any(), any());
        verify(users, never()).save(any());
    }

    @Test
    void legacyDepositWebhookStillCreditsTheUserBalance() {
        User user = user("buyer", "4.00");
        Transaction transaction = transaction(user, null);
        when(transactions.findByOrderId("DEPOSIT_order-1")).thenReturn(Optional.of(transaction));
        Map<String, Object> payload = Map.of(
                "order_id", "DEPOSIT_order-1",
                "payment_status", "finished"
        );

        service.processWebhook(payload, signature(payload));

        assertEquals(new BigDecimal("22.50"), user.getBalance());
        verify(users).save(user);
        verify(proxies, never()).purchaseProxyWithCrypto(any(), any(), any());
    }

    private User user(String username, String balance) {
        User user = new User();
        user.setUsername(username);
        user.setBalance(new BigDecimal(balance));
        return user;
    }

    private Transaction transaction(User user, String purpose) {
        Transaction transaction = new Transaction();
        transaction.setPaymentId("invoice-123");
        transaction.setOrderId(purpose == null ? "DEPOSIT_order-1" : "PROXY_order-1");
        transaction.setAmount(new BigDecimal("18.50"));
        transaction.setStatus("PENDING");
        transaction.setPaymentPurpose(purpose);
        transaction.setUser(user);
        return transaction;
    }

    private String signature(Map<String, Object> payload) {
        return ReflectionTestUtils.invokeMethod(service, "signCanonicalPayload", payload);
    }
}

package com.example.uniproxy;

import com.example.uniproxy.config.JwtUtils;
import com.example.uniproxy.model.Transaction;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.TransactionRepository;
import com.example.uniproxy.repository.UserProxyRepository;
import com.example.uniproxy.repository.UserRepository;
import com.example.uniproxy.service.CatProxiesApiService;
import com.example.uniproxy.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "debug=false",
        "spring.datasource.url=jdbc:h2:mem:payment-checkout;DB_CLOSE_DELAY=-1",
        "nowpayments.api-key=test-key",
        "nowpayments.ipn-secret=test-secret",
        "nowpayments.invoice-url=https://payments.example.test/invoice"
})
@ActiveProfiles("local")
@AutoConfigureMockMvc
class PaymentCheckoutIntegrationTests {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private UserProxyRepository inventory;
    @Autowired private TransactionRepository transactions;
    @Autowired private PaymentService payments;
    @Autowired private JwtUtils jwt;
    @Autowired private ObjectMapper mapper;
    @MockitoBean private CatProxiesApiService provider;

    private User buyer;
    private String token;
    private String invoiceId;

    @BeforeEach
    @SuppressWarnings({"rawtypes", "unchecked"})
    void setup() {
        buyer = new User();
        buyer.setUsername("crypto-" + UUID.randomUUID());
        buyer.setEmail(buyer.getUsername() + "@example.test");
        buyer.setPassword("test-only");
        buyer.setBalance(BigDecimal.ZERO);
        buyer = users.saveAndFlush(buyer);
        token = jwt.generateToken(buyer.getUsername(), "USER");
        invoiceId = UUID.randomUUID().toString();

        RestTemplate http = mock(RestTemplate.class);
        ReflectionTestUtils.setField(payments, "restTemplate", http);
        when(http.postForEntity(eq("https://payments.example.test/invoice"), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(Map.of("id", invoiceId, "invoice_url", "https://payments.example.test/checkout")));
        when(provider.getStore("Ipv6p")).thenReturn(Map.of("payload", Map.of("products", List.of(
                Map.of("packageId", "ipv6-real", "title", "IPv6 250GB", "proxyType", "Ipv6p", "price", "20.00")
        ))));
        when(provider.createOrder(any())).thenReturn(Map.of("payload", Map.of("order", Map.of("id", "cat-" + invoiceId))));
        when(provider.getOrder("cat-" + invoiceId)).thenReturn(Map.of("payload", Map.of(
                "order", Map.of("id", "cat-" + invoiceId, "status", "ACTIVE"),
                "proxyCredentials", Map.of("host", "proxy.example.test", "port", 8080, "username", "proxy-user", "password", "proxy-password")
        )));
    }

    @Test
    void zeroBalanceBuyerCanPayDirectlyAndDuplicateCallbacksDoNotReorder() throws Exception {
        Transaction transaction = createCheckout();
        verify(provider, never()).createOrder(any());
        Map<String, Object> payload = finishedPayload(transaction);
        String json = mapper.writeValueAsString(payload);
        String signature = signature(payload);

        for (int retry = 0; retry < 2; retry++) {
            mvc.perform(post("/api/payments/webhook").contentType(MediaType.APPLICATION_JSON)
                            .header("x-nowpayments-sig", signature).content(json))
                    .andExpect(status().isOk());
        }

        verify(provider, times(1)).createOrder(Map.of("packageId", "ipv6-real"));
        assertEquals(0, users.findById(buyer.getId()).orElseThrow().getBalance().compareTo(BigDecimal.ZERO));
        assertEquals("FINISHED", transactions.findById(transaction.getId()).orElseThrow().getStatus());
        assertEquals("proxy.example.test", inventory.findByUser(buyer).get(0).getIp());
    }

    @Test
    void concurrentFinishedCallbacksCreateOnlyOneProviderOrder() throws Exception {
        Transaction transaction = createCheckout();
        Map<String, Object> payload = finishedPayload(transaction);
        String signature = signature(payload);
        CountDownLatch start = new CountDownLatch(1);
        var pool = Executors.newFixedThreadPool(2);
        try {
            var first = pool.submit(() -> { start.await(); payments.processWebhook(payload, signature); return null; });
            var second = pool.submit(() -> { start.await(); payments.processWebhook(payload, signature); return null; });
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }

        verify(provider, times(1)).createOrder(any());
        assertEquals(1, inventory.findByUser(buyer).size());
    }

    private Transaction createCheckout() throws Exception {
        mvc.perform(post("/api/payments/proxy-purchase").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"packageId\":\"ipv6-real\",\"proxyType\":\"Ipv6p\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("https://payments.example.test/checkout"));
        return transactions.findAll().stream().filter(tx -> invoiceId.equals(tx.getPaymentId())).findFirst().orElseThrow();
    }

    @Test
    void customersCannotBypassCheckoutThroughInternalProviderOrders() throws Exception {
        mvc.perform(post("/api/proxies/provider/order").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"packageId\":\"ipv6-real\"}"))
                .andExpect(status().isForbidden());
        verify(provider, never()).createOrder(any());
    }

    @Test
    void cryptoCheckoutRequiresALoggedInBuyer() throws Exception {
        mvc.perform(post("/api/payments/proxy-purchase").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"packageId\":\"ipv6-real\",\"proxyType\":\"Ipv6p\"}"))
                .andExpect(status().isForbidden());
        verify(provider, never()).createOrder(any());
    }

    private Map<String, Object> finishedPayload(Transaction transaction) {
        return Map.of("order_id", transaction.getOrderId(), "payment_id", "different-from-invoice",
                "payment_status", "finished", "price_currency", "usd", "price_amount", 20,
                "pay_amount", "0.0003", "actually_paid", "0.0003");
    }

    private String signature(Map<String, Object> payload) throws Exception {
        Mac hmac = Mac.getInstance("HmacSHA512");
        hmac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        return HexFormat.of().formatHex(hmac.doFinal(mapper.writeValueAsString(new TreeMap<>(payload)).getBytes(StandardCharsets.UTF_8)));
    }
}

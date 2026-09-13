package com.example.uniproxy.service;

import com.example.uniproxy.model.User;
import com.example.uniproxy.model.UserProxy;
import com.example.uniproxy.repository.UserProxyRepository;
import com.example.uniproxy.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProxyAllocationTests {
    private final CatProxiesApiService provider = mock(CatProxiesApiService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final UserProxyRepository proxies = mock(UserProxyRepository.class);
    private final ProxyService service = new ProxyService();
    private final User user = new User();

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "catProxiesApiService", provider);
        ReflectionTestUtils.setField(service, "userRepository", users);
        ReflectionTestUtils.setField(service, "userProxyRepository", proxies);
        user.setBalance(new BigDecimal("100.00"));
        when(provider.getStore("DatacenterP")).thenReturn(Map.of("payload", Map.of("products", List.of(Map.of("packageId", "dc", "title", "Datacenter", "proxyType", "DatacenterP", "ips", 100, "resellerPrice", "10.00")))));
        when(provider.getDatacenterCountries()).thenReturn(Map.of("payload", Map.of("countries", List.of(Map.of("code", "US", "available", 60), Map.of("code", "DE", "available", 50)))));
        when(provider.createOrder(any())).thenReturn(Map.of());
        when(proxies.save(any(UserProxy.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Map<String, Object> request(Map<String, ?> allocation) {
        return Map.of("packageId", "dc", "proxyType", "DatacenterP", "countryProxies", allocation);
    }

    @Test
    void sendsExactMultiCountryAllocationAndChargesFixedPackagePrice() {
        Map<String, Object> response = service.purchaseProxy(user, request(Map.of("US", 60, "DE", 40)));
        verify(provider).createOrder(Map.of("packageId", "dc", "datacenterPData", Map.of("country_proxies", Map.of("US", 60, "DE", 40), "high_concurrency", false, "high_priority", false, "whitelisted_ips", false)));
        assertEquals(new BigDecimal("10.00"), response.get("chargedAmount"));
        assertEquals(new BigDecimal("90.00"), user.getBalance());
    }

    @Test
    void rejectsBadTotalsCountsAndUnsupportedCountriesWithoutPurchasing() {
        for (Map<String, ?> allocation : List.of(Map.of("US", 60, "DE", 39), Map.of("US", 60.5, "DE", 39.5), Map.of("US", -1, "DE", 101), Map.of("XX", 100))) {
            assertThrows(IllegalArgumentException.class, () -> service.purchaseProxy(user, request(allocation)));
        }
        verify(provider, never()).createOrder(any());
        verify(users, never()).save(any());
        assertEquals(new BigDecimal("100.00"), user.getBalance());
    }

    @Test
    void rejectsAllocationWhenLiveStockShrinks() {
        when(provider.getDatacenterCountries()).thenReturn(Map.of("payload", Map.of("countries", List.of(Map.of("code", "US", "available", 10), Map.of("code", "DE", "available", 50)))));
        assertThrows(IllegalArgumentException.class, () -> service.purchaseProxy(user, request(Map.of("US", 60, "DE", 40))));
        verify(provider, never()).createOrder(any());
    }

    @Test
    void rejectsUnavailableCountryDataWithoutPurchasing() {
        when(provider.getDatacenterCountries()).thenReturn(Map.of("payload", Map.of("countries", List.of())));
        assertThrows(IllegalStateException.class, () -> service.purchaseProxy(user, request(Map.of("US", 60, "DE", 40))));
        verify(provider, never()).createOrder(any());
    }
}

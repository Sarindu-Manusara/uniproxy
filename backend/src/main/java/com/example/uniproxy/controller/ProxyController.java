package com.example.uniproxy.controller;

import com.example.uniproxy.model.User;
import com.example.uniproxy.model.UserProxy;
import com.example.uniproxy.repository.UserRepository;
import com.example.uniproxy.repository.UserProxyRepository;
import com.example.uniproxy.service.CatProxiesApiService;
import com.example.uniproxy.service.ProxyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/proxies")
public class ProxyController {

    @Autowired
    private ProxyService proxyService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProxyRepository userProxyRepository;

    @Autowired
    private CatProxiesApiService catProxiesApiService;

    // Updated: Returns a list of proxies belonging to the logged-in user
    @GetMapping("/my-list")
    public List<UserProxy> getMyProxies() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return userProxyRepository.findByUser(user);
    }

    @PostMapping("/purchase")
    public ResponseEntity<Object> purchase(
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            if (body == null || body.isEmpty()) {
                return ResponseEntity.badRequest().body("Select a live CatProxies package before purchasing.");
            }
            return ResponseEntity.ok(proxyService.purchaseProxy(user, body));
        } catch (IllegalArgumentException | IllegalStateException error) {
            return ResponseEntity.badRequest().body(error.getMessage());
        } catch (RuntimeException error) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error.getMessage());
        }
    }

    @GetMapping("/provider/account")
    public ResponseEntity<Object> providerAccount() {
        return providerResponse(catProxiesApiService::getAccount);
    }

    @GetMapping("/provider/store")
    public ResponseEntity<Object> providerStore(@RequestParam(required = false) String proxyType) {
        String normalizedProxyType = normalizeProviderProxyType(proxyType);
        if (normalizedProxyType != null && !isResoldProviderProxyType(normalizedProxyType)) {
            return ResponseEntity.badRequest().body("Only Datacenter and IPv6 provider store filters are available.");
        }
        return providerResponse(() -> catProxiesApiService.getStore(normalizedProxyType));
    }

    @GetMapping("/provider/datacenterp-countries")
    public ResponseEntity<Object> providerDatacenterCountries() {
        return providerResponse(catProxiesApiService::getDatacenterCountries);
    }

    @GetMapping("/provider/orders")
    public ResponseEntity<Object> providerOrders() {
        return providerResponse(catProxiesApiService::getOrders);
    }

    @PostMapping("/provider/order")
    public ResponseEntity<Object> providerCreateOrder(@RequestBody Map<String, Object> body) {
        return providerResponse(() -> catProxiesApiService.createOrder(body));
    }

    @GetMapping("/provider/order/{orderId}")
    public ResponseEntity<Object> providerOrder(@PathVariable String orderId) {
        return providerResponse(() -> catProxiesApiService.getOrder(orderId));
    }

    @GetMapping("/provider/order/{orderId}/extend-options")
    public ResponseEntity<Object> providerExtendOptions(@PathVariable String orderId) {
        return providerResponse(() -> catProxiesApiService.getExtendOptions(orderId));
    }

    @PostMapping("/provider/order/{orderId}/extend")
    public ResponseEntity<Object> providerExtendOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        return providerResponse(() -> catProxiesApiService.extendOrder(orderId, body == null ? Map.of() : body));
    }

    @GetMapping("/provider/order/{orderId}/whitelist")
    public ResponseEntity<Object> providerListWhitelistIps(@PathVariable String orderId) {
        return providerResponse(() -> catProxiesApiService.listWhitelistIps(orderId));
    }

    @PatchMapping("/provider/order/{orderId}/whitelist")
    public ResponseEntity<Object> providerAddWhitelistIp(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body
    ) {
        return providerResponse(() -> catProxiesApiService.addWhitelistIp(orderId, body));
    }

    @DeleteMapping("/provider/order/{orderId}/whitelist")
    public ResponseEntity<Object> providerRemoveWhitelistIp(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body
    ) {
        return providerResponse(() -> catProxiesApiService.removeWhitelistIp(orderId, body));
    }

    @GetMapping("/provider/order/{orderId}/usage-stats")
    public ResponseEntity<Object> providerUsageStats(@PathVariable String orderId) {
        return providerResponse(() -> catProxiesApiService.getUsageStats(orderId));
    }

    @PostMapping("/provider/order/{orderId}/reset-password")
    public ResponseEntity<Object> providerResetPassword(@PathVariable String orderId) {
        return providerResponse(() -> catProxiesApiService.resetPassword(orderId));
    }

    private ResponseEntity<Object> providerResponse(Supplier<Object> request) {
        try {
            return ResponseEntity.ok(request.get());
        } catch (IllegalStateException error) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error.getMessage());
        } catch (RuntimeException error) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error.getMessage());
        }
    }

    private String normalizeProviderProxyType(String proxyType) {
        if (proxyType == null || proxyType.isBlank()) {
            return null;
        }

        return switch (proxyType.toLowerCase()) {
            case "datacenter", "datacenterp" -> "DatacenterP";
            case "ipv6", "ipv6p" -> "Ipv6p";
            default -> proxyType;
        };
    }

    private boolean isResoldProviderProxyType(String proxyType) {
        return "DatacenterP".equals(proxyType) || "Ipv6p".equals(proxyType);
    }
}

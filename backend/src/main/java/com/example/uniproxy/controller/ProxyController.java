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
    public Object providerAccount() {
        return catProxiesApiService.getAccount();
    }

    @GetMapping("/provider/store")
    public Object providerStore(@RequestParam(required = false) String proxyType) {
        return catProxiesApiService.getStore(proxyType);
    }

    @GetMapping("/provider/servers")
    public Object providerServers() {
        return catProxiesApiService.getServers();
    }

    @GetMapping("/provider/datacenterp-countries")
    public Object providerDatacenterCountries() {
        return catProxiesApiService.getDatacenterCountries();
    }

    @GetMapping("/provider/orders")
    public Object providerOrders() {
        return catProxiesApiService.getOrders();
    }

    @PostMapping("/provider/order")
    public Object providerCreateOrder(@RequestBody Map<String, Object> body) {
        return catProxiesApiService.createOrder(body);
    }

    @GetMapping("/provider/order/{orderId}")
    public Object providerOrder(@PathVariable String orderId) {
        return catProxiesApiService.getOrder(orderId);
    }

    @GetMapping("/provider/order/{orderId}/extend-options")
    public Object providerExtendOptions(@PathVariable String orderId) {
        return catProxiesApiService.getExtendOptions(orderId);
    }

    @PostMapping("/provider/order/{orderId}/extend")
    public Object providerExtendOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        return catProxiesApiService.extendOrder(orderId, body == null ? Map.of() : body);
    }

    @GetMapping("/provider/order/{orderId}/whitelist")
    public Object providerListWhitelistIps(@PathVariable String orderId) {
        return catProxiesApiService.listWhitelistIps(orderId);
    }

    @PatchMapping("/provider/order/{orderId}/whitelist")
    public Object providerAddWhitelistIp(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body
    ) {
        return catProxiesApiService.addWhitelistIp(orderId, body);
    }

    @DeleteMapping("/provider/order/{orderId}/whitelist")
    public Object providerRemoveWhitelistIp(
            @PathVariable String orderId,
            @RequestBody Map<String, Object> body
    ) {
        return catProxiesApiService.removeWhitelistIp(orderId, body);
    }

    @GetMapping("/provider/order/{orderId}/usage-stats")
    public Object providerUsageStats(@PathVariable String orderId) {
        return catProxiesApiService.getUsageStats(orderId);
    }

    @PostMapping("/provider/order/{orderId}/reset-password")
    public Object providerResetPassword(@PathVariable String orderId) {
        return catProxiesApiService.resetPassword(orderId);
    }

    @GetMapping("/provider/order/{orderId}/proxies")
    public Object providerOrderProxies(@PathVariable String orderId) {
        return catProxiesApiService.getOrderProxies(orderId);
    }

    @GetMapping("/provider/order/{orderId}/unlimited-metrics")
    public Object providerUnlimitedMetrics(
            @PathVariable String orderId,
            @RequestParam(required = false) String view,
            @RequestParam(required = false) String timeframe,
            @RequestParam(required = false) String interval,
            @RequestParam(required = false) Integer page
    ) {
        return catProxiesApiService.getUnlimitedMetrics(orderId, view, timeframe, interval, page);
    }

    @GetMapping("/provider/targeting/gresi")
    public Object providerGresiTargeting() {
        return catProxiesApiService.getGresiTargetingOptions();
    }

    @GetMapping("/provider/targeting/mobile/countries")
    public Object providerMobileCountries() {
        return catProxiesApiService.getMobileCountries();
    }

    @GetMapping("/provider/targeting/mobile/regions")
    public Object providerMobileRegions(@RequestParam(required = false) String countryId) {
        return catProxiesApiService.getMobileRegions(countryId);
    }

    @GetMapping("/provider/targeting/mobile/cities")
    public Object providerMobileCities(
            @RequestParam(required = false) String countryId,
            @RequestParam(required = false) String regionId
    ) {
        return catProxiesApiService.getMobileCities(countryId, regionId);
    }

    @GetMapping("/provider/targeting/mobile/isps")
    public Object providerMobileIsps(
            @RequestParam(required = false) String countryId,
            @RequestParam(required = false) String regionId,
            @RequestParam(required = false) String cityId
    ) {
        return catProxiesApiService.getMobileIsps(countryId, regionId, cityId);
    }
}

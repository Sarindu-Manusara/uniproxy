package com.example.uniproxy.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CatProxiesApiService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${catproxies.api-base-url}")
    private String apiBaseUrl;

    @Value("${catproxies.api-key}")
    private String apiKey;

    public Object getAccount() {
        return request(HttpMethod.GET, "/account", null, null);
    }

    public Object getStore(String proxyType) {
        Map<String, String> query = new HashMap<>(Map.of("page", "1", "pageSize", "100"));
        if (proxyType != null && !proxyType.isBlank()) query.put("proxyType", proxyType);
        Object response = request(HttpMethod.GET, "/store", query, null);
        if (!(response instanceof Map<?, ?> root) || !(root.get("payload") instanceof Map<?, ?> payload)
                || !(payload.get("products") instanceof List<?> firstPage)) return response;

        Map<?, ?> pagination = root.get("pagination") instanceof Map<?, ?> map ? map : Map.of();
        int totalPages = pagination.get("totalPages") == null ? 1 : Integer.parseInt(pagination.get("totalPages").toString());
        if (totalPages < 0 || totalPages > 1000 || (totalPages == 0 && !firstPage.isEmpty())) throw new IllegalStateException("Invalid provider catalog pagination.");
        List<Object> products = new ArrayList<>(firstPage);
        for (int page = 2; page <= totalPages; page++) {
            query.put("page", Integer.toString(page));
            Object next = request(HttpMethod.GET, "/store", query, null);
            if (!(next instanceof Map<?, ?> nextRoot) || !(nextRoot.get("payload") instanceof Map<?, ?> nextPayload)
                    || !(nextPayload.get("products") instanceof List<?> nextProducts)) {
                throw new IllegalStateException("Unable to load the complete provider catalog.");
            }
            products.addAll(nextProducts);
        }
        Map<String, Object> result = copyMap(root);
        Map<String, Object> combinedPayload = copyMap(payload);
        combinedPayload.put("products", products);
        combinedPayload.put("totalProducts", products.size());
        result.put("payload", combinedPayload);
        result.put("pagination", Map.of("page", 1, "pageSize", products.size(), "totalPages", 1, "totalItems", products.size()));
        return result;
    }

    private Map<String, Object> copyMap(Map<?, ?> source) {
        Map<String, Object> result = new HashMap<>();
        source.forEach((key, value) -> result.put(key.toString(), value));
        return result;
    }

    public Object getServers() {
        return request(HttpMethod.GET, "/servers", null, null);
    }

    public Object getDatacenterCountries() {
        return request(HttpMethod.GET, "/datacenterp-countries", null, null);
    }

    public Object getOrders() {
        return request(HttpMethod.GET, "/orders", null, null);
    }

    public Object createOrder(Map<String, Object> body) {
        return request(HttpMethod.POST, "/order", null, body);
    }

    public Object getOrder(String orderId) {
        return request(HttpMethod.GET, "/order/" + orderId, null, null);
    }

    public Object getExtendOptions(String orderId) {
        return request(HttpMethod.GET, "/order/" + orderId + "/extendOptions", null, null);
    }

    public Object extendOrder(String orderId, Map<String, Object> body) {
        return request(HttpMethod.POST, "/order/" + orderId + "/extend", null, body);
    }

    public Object listWhitelistIps(String orderId) {
        return request(HttpMethod.GET, "/order/" + orderId + "/whitelist", null, null);
    }

    public Object addWhitelistIp(String orderId, Map<String, Object> body) {
        return request(HttpMethod.PATCH, "/order/" + orderId + "/whitelist", null, body);
    }

    public Object removeWhitelistIp(String orderId, Map<String, Object> body) {
        return request(HttpMethod.DELETE, "/order/" + orderId + "/whitelist", null, body);
    }

    public Object getUsageStats(String orderId) {
        return request(HttpMethod.GET, "/order/" + orderId + "/usage-stats", null, null);
    }

    public Object resetPassword(String orderId) {
        return request(HttpMethod.POST, "/order/" + orderId + "/reset-password", null, Map.of());
    }

    public Object getOrderProxies(String orderId) {
        return request(HttpMethod.GET, "/order/" + orderId + "/proxies", null, null);
    }

    public Object getUnlimitedMetrics(
            String orderId,
            String view,
            String timeframe,
            String interval,
            Integer page
    ) {
        UriParams params = new UriParams();
        params.putIfPresent("view", view);
        params.putIfPresent("timeframe", timeframe);
        params.putIfPresent("interval", interval);
        if (page != null) {
            params.putIfPresent("page", page.toString());
        }

        return request(HttpMethod.GET, "/order/" + orderId + "/unlimited-metrics", params.values(), null);
    }

    public Object getGresiTargetingOptions() {
        return request(HttpMethod.GET, "/gresi-targeting-options", null, null);
    }

    public Object getMobileCountries() {
        return request(HttpMethod.GET, "/mobile-targeting-options/countries", null, null);
    }

    public Object getMobileRegions(String countryId) {
        return request(
                HttpMethod.GET,
                "/mobile-targeting-options/regions",
                countryId == null || countryId.isBlank() ? null : Map.of("countryId", countryId),
                null
        );
    }

    public Object getMobileCities(String countryId, String regionId) {
        UriParams params = new UriParams();
        params.putIfPresent("countryId", countryId);
        params.putIfPresent("regionId", regionId);
        return request(HttpMethod.GET, "/mobile-targeting-options/cities", params.values(), null);
    }

    public Object getMobileIsps(String countryId, String regionId, String cityId) {
        UriParams params = new UriParams();
        params.putIfPresent("countryId", countryId);
        params.putIfPresent("regionId", regionId);
        params.putIfPresent("cityId", cityId);
        return request(HttpMethod.GET, "/mobile-targeting-options/isps", params.values(), null);
    }

    private Object request(
            HttpMethod method,
            String path,
            Map<String, String> query,
            Map<String, Object> body
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("CATPROXIES_API_KEY is not configured.");
        }

        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(apiBaseUrl.replaceAll("/+$", "") + path);

        if (query != null) {
            query.forEach(builder::queryParam);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    builder.toUriString(),
                    method,
                    entity,
                    Object.class
            );

            return response.getBody();
        } catch (HttpStatusCodeException error) {
            throw new RuntimeException(error.getResponseBodyAsString(), error);
        }
    }

    private static final class UriParams {
        private final HashMap<String, String> values = new HashMap<>();

        void putIfPresent(String key, String value) {
            if (value != null && !value.isBlank()) {
                values.put(key, value);
            }
        }

        Map<String, String> values() {
            return values.isEmpty() ? null : values;
        }
    }
}

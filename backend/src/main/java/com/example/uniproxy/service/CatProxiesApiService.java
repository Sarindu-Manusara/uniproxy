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
        return request(
                HttpMethod.GET,
                "/store",
                proxyType == null || proxyType.isBlank() ? null : Map.of("proxyType", proxyType),
                null
        );
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

    public Object addWhitelistIp(String orderId, Map<String, Object> body) {
        return request(HttpMethod.PATCH, "/order/" + orderId + "/whitelist", null, body);
    }

    public Object removeWhitelistIp(String orderId, Map<String, Object> body) {
        return request(HttpMethod.DELETE, "/order/" + orderId + "/whitelist", null, body);
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
        private final java.util.HashMap<String, String> values = new java.util.HashMap<>();

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

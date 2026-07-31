package com.example.uniproxy.service;

import com.example.uniproxy.model.User;
import com.example.uniproxy.model.UserProxy;
import com.example.uniproxy.repository.UserProxyRepository;
import com.example.uniproxy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class ProxyService {

    @Autowired
    private UserProxyRepository userProxyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CatProxiesApiService catProxiesApiService;

    @Transactional
    public Map<String, Object> purchaseProxy(User user, Map<String, Object> request) {
        String packageId = firstString(request, "packageId", "providerPackageId");
        if (packageId == null) {
            throw new IllegalArgumentException("Select a live CatProxies package before purchasing.");
        }

        String requestedProxyType = normalizeProxyType(firstString(request, "proxyType", "providerProxyType"));
        Map<String, Object> product = findStoreProduct(packageId, requestedProxyType);
        String proxyType = normalizeProxyType(
                firstString(product, "proxyType", "type", "category") != null
                        ? firstString(product, "proxyType", "type", "category")
                        : requestedProxyType
        );

        BigDecimal chargeAmount = resolveChargeAmount(product, request, proxyType);
        BigDecimal currentBalance = user.getBalance() == null ? BigDecimal.ZERO : user.getBalance();

        if (currentBalance.compareTo(chargeAmount) < 0) {
            throw new IllegalStateException(
                    "Insufficient balance. Required: $" + chargeAmount + ", available: $" + currentBalance + "."
            );
        }

        Map<String, Object> orderPayload = buildOrderPayload(packageId, proxyType, product, request);
        Object createOrderResponse = catProxiesApiService.createOrder(orderPayload);
        String orderId = extractOrderId(createOrderResponse);
        Object orderDetails = orderId == null
                ? createOrderResponse
                : catProxiesApiService.getOrder(orderId);

        List<UserProxy> savedProxies = saveProviderProxies(
                user,
                packageId,
                firstString(product, "title", "name", "packageName"),
                proxyType,
                orderId,
                orderDetails
        );

        if (savedProxies.isEmpty()) {
            savedProxies.add(savePendingProxy(
                    user,
                    packageId,
                    firstString(product, "title", "name", "packageName"),
                    proxyType,
                    orderId
            ));
        }

        user.setBalance(currentBalance.subtract(chargeAmount));
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "CatProxies order purchased successfully.");
        response.put("provider", "CatProxies");
        response.put("orderId", orderId);
        response.put("chargedAmount", chargeAmount);
        response.put("savedProxies", savedProxies.size());
        response.put("orderPayload", orderPayload);
        return response;
    }

    private Map<String, Object> buildOrderPayload(
            String packageId,
            String proxyType,
            Map<String, Object> product,
            Map<String, Object> request
    ) {
        Map<String, Object> body = new HashMap<>();
        body.put("packageId", packageId);

        if (isIsp(proxyType)) {
            Map<String, Object> ispData = new HashMap<>();
            ispData.put("quantity", requestInt(request, "quantity", 1));

            if ("Isp".equals(proxyType)) {
                Integer countryId = requestInt(request, "countryId", null);
                if (countryId == null) {
                    countryId = firstLocationId(product);
                }
                if (countryId != null) {
                    ispData.put("countryId", countryId);
                }

                String authMethod = firstString(request, "authMethod");
                String authIp = firstString(request, "authIp");
                if (authMethod != null) {
                    ispData.put("authMethod", authMethod);
                }
                if (authIp != null) {
                    ispData.put("authIp", authIp);
                }
            }

            body.put("ispData", ispData);
        }

        if ("DatacenterP".equals(proxyType)) {
            Map<String, Object> datacenterPData = new HashMap<>();
            datacenterPData.put("country_proxies", resolveCountryProxies(product, request));
            datacenterPData.put("high_concurrency", requestBoolean(request, "highConcurrency"));
            datacenterPData.put("high_priority", requestBoolean(request, "highPriority"));
            datacenterPData.put("whitelisted_ips", requestBoolean(request, "whitelistedIps"));
            body.put("datacenterPData", datacenterPData);
        }

        if ("UnlimitedResidential".equals(proxyType)) {
            Object gatewayServer = firstPresent(request, "gateway_server", "gatewayServer", "gatewayServerId");
            if (gatewayServer == null) {
                gatewayServer = firstServerId(catProxiesApiService.getServers());
            }
            if (gatewayServer == null) {
                throw new IllegalArgumentException("Unlimited Residential requires a CatProxies gateway server.");
            }
            body.put("gateway_server", gatewayServer);
        }

        return body;
    }

    private List<UserProxy> saveProviderProxies(
            User user,
            String packageId,
            String packageName,
            String proxyType,
            String orderId,
            Object orderDetails
    ) {
        Map<String, Object> order = findOrder(orderDetails);
        Map<String, Object> credentials = findCredentials(orderDetails, order);
        List<UserProxy> saved = new ArrayList<>();

        if ("DatacenterP".equals(proxyType)) {
            List<String> ips = new ArrayList<>();
            collectIps(firstPresent(credentials, "ip_list", "ips"), ips);
            int port = firstIntOrDefault(credentials, defaultPort(proxyType), "port_http", "port", "httpPort");

            for (String ip : ips) {
                saved.add(saveProxyLine(
                        user,
                        packageId,
                        packageName,
                        proxyType,
                        orderId,
                        firstString(order, "status"),
                        ip,
                        port,
                        firstString(credentials, "username", "login"),
                        firstString(credentials, "password", "pass"),
                        "HTTP",
                        firstExpiry(order, credentials)
                ));
            }
        }

        if (isIsp(proxyType) && orderId != null) {
            Object proxyLines = catProxiesApiService.getOrderProxies(orderId);
            for (Map<String, Object> line : unwrapArray(proxyLines)) {
                saved.add(saveProxyLine(
                        user,
                        packageId,
                        packageName,
                        proxyType,
                        orderId,
                        firstString(order, "status"),
                        firstString(line, "host", "hostip", "ip"),
                        firstIntOrDefault(line, defaultPort(proxyType), "port", "port_http", "port_socks", "port_socks5"),
                        firstString(line, "username", "login", "user"),
                        firstString(line, "password", "pass"),
                        firstString(line, "protocol") == null ? "HTTP" : firstString(line, "protocol"),
                        firstExpiry(line, order)
                ));
            }
        }

        if (saved.isEmpty() && !credentials.isEmpty()) {
            saved.add(saveProxyLine(
                    user,
                    packageId,
                    packageName,
                    proxyType,
                    orderId,
                    firstString(order, "status"),
                    firstString(credentials, "hostip", "host", "ip", "server"),
                    firstIntOrDefault(credentials, defaultPort(proxyType), "port", "port_http", "httpPort"),
                    firstString(credentials, "username", "login", "user"),
                    firstString(credentials, "password", "pass"),
                    "HTTP",
                    firstExpiry(credentials, order)
            ));
        }

        return saved;
    }

    private UserProxy savePendingProxy(
            User user,
            String packageId,
            String packageName,
            String proxyType,
            String orderId
    ) {
        return saveProxyLine(
                user,
                packageId,
                packageName,
                proxyType,
                orderId,
                "PENDING",
                "pending.catproxies.com",
                0,
                "pending",
                "pending",
                "HTTP",
                LocalDateTime.now().plusDays(30)
        );
    }

    private UserProxy saveProxyLine(
            User user,
            String packageId,
            String packageName,
            String proxyType,
            String orderId,
            String status,
            String host,
            int port,
            String username,
            String password,
            String protocol,
            LocalDateTime expiry
    ) {
        UserProxy proxy = new UserProxy();
        proxy.setProvider("CatProxies");
        proxy.setProviderOrderId(orderId);
        proxy.setPackageId(packageId);
        proxy.setPackageName(packageName);
        proxy.setProxyType(proxyType);
        proxy.setProviderStatus(status);
        proxy.setProtocol(protocol);
        proxy.setIp(host == null ? "pending.catproxies.com" : host);
        proxy.setPort(port);
        proxy.setProxyUsername(username == null ? "" : username);
        proxy.setProxyPassword(password == null ? "" : password);
        proxy.setExpiryDate(expiry == null ? LocalDateTime.now().plusDays(30) : expiry);
        proxy.setUser(user);
        return userProxyRepository.save(proxy);
    }

    private Map<String, Object> findStoreProduct(String packageId, String proxyType) {
        Map<String, Object> product = findStoreProductInResponse(packageId, catProxiesApiService.getStore(proxyType));

        if (product.isEmpty() && proxyType != null) {
            product = findStoreProductInResponse(packageId, catProxiesApiService.getStore(null));
        }

        if (product.isEmpty()) {
            throw new IllegalArgumentException("CatProxies package was not found in your reseller store.");
        }

        return product;
    }

    private Map<String, Object> findStoreProductInResponse(String packageId, Object response) {
        return unwrapArray(response).stream()
                .filter(product -> packageId.equals(firstString(product, "id", "packageId", "_id")))
                .findFirst()
                .orElseGet(Map::of);
    }

    private BigDecimal resolveChargeAmount(
            Map<String, Object> product,
            Map<String, Object> request,
            String proxyType
    ) {
        BigDecimal unitPrice = firstBigDecimal(product, "resellerPrice", "price", "amount", "total");

        if (unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("CatProxies product price is missing.");
        }

        BigDecimal price = unitPrice;
        if (isIsp(proxyType)) {
            price = unitPrice.multiply(BigDecimal.valueOf(requestInt(request, "quantity", 1)));
        }

        if ("DatacenterP".equals(proxyType)) {
            int addonCount = 0;
            addonCount += requestBoolean(request, "highConcurrency") ? 1 : 0;
            addonCount += requestBoolean(request, "highPriority") ? 1 : 0;
            addonCount += requestBoolean(request, "whitelistedIps") ? 1 : 0;
            price = price.multiply(BigDecimal.valueOf(1 + (addonCount * 0.25)));
        }

        return price.setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private Map<String, Object> resolveCountryProxies(
            Map<String, Object> product,
            Map<String, Object> request
    ) {
        Object explicit = firstPresent(request, "countryProxies", "country_proxies");
        if (explicit instanceof Map<?, ?> explicitMap) {
            return copyMap(explicitMap);
        }

        Map<String, Object> datacenterPData = asMap(request.get("datacenterPData"));
        Object nested = datacenterPData.get("country_proxies");
        if (nested instanceof Map<?, ?> nestedMap) {
            return copyMap(nestedMap);
        }

        String countryCode = firstString(request, "countryCode");
        if (countryCode == null) {
            countryCode = "US";
        }

        int quantity = requestInt(
                request,
                "quantity",
                firstIntOrDefault(product, 1, "ips", "quantity", "proxyNumber")
        );
        return Map.of(countryCode.toUpperCase(Locale.ROOT), quantity);
    }

    private Integer firstLocationId(Map<String, Object> product) {
        for (Map<String, Object> location : unwrapArray(product.get("locations"))) {
            Integer id = firstIntOrNull(location, null, "id", "countryId");
            if (id != null) {
                return id;
            }
        }
        return null;
    }

    private Object firstServerId(Object serversResponse) {
        for (Map<String, Object> server : unwrapArray(serversResponse)) {
            Object id = firstPresent(server, "id", "serverId", "gateway_server");
            if (id != null) {
                return id;
            }
        }
        return null;
    }

    private String extractOrderId(Object response) {
        Map<String, Object> order = findOrder(response);
        String id = firstString(order, "id", "orderId", "_id");
        if (id != null) {
            return id;
        }

        Map<String, Object> root = asMap(response);
        return firstString(root, "id", "orderId", "_id");
    }

    private Map<String, Object> findOrder(Object response) {
        Map<String, Object> root = asMap(response);
        Map<String, Object> payload = asMap(root.get("payload"));

        if (!asMap(payload.get("order")).isEmpty()) {
            return asMap(payload.get("order"));
        }
        if (!asMap(root.get("order")).isEmpty()) {
            return asMap(root.get("order"));
        }
        if (!payload.isEmpty()) {
            return payload;
        }
        return root;
    }

    private Map<String, Object> findCredentials(Object response, Map<String, Object> order) {
        Map<String, Object> credentials = asMap(order.get("proxyCredentials"));
        if (!credentials.isEmpty()) {
            return credentials;
        }

        Map<String, Object> root = asMap(response);
        credentials = asMap(root.get("proxyCredentials"));
        if (!credentials.isEmpty()) {
            return credentials;
        }

        return asMap(asMap(root.get("payload")).get("proxyCredentials"));
    }

    private LocalDateTime firstExpiry(Map<String, Object> primary, Map<String, Object> secondary) {
        String value = firstString(primary, "expired_at", "expiresAt", "expiryDate", "expiry");
        if (value == null) {
            value = firstString(secondary, "expired_at", "expiresAt", "expiryDate", "expiry");
        }

        if (value == null) {
            return LocalDateTime.now().plusDays(30);
        }

        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (Exception ignoredAgain) {
                return LocalDateTime.now().plusDays(30);
            }
        }
    }

    private void collectIps(Object value, List<String> ips) {
        if (value == null) {
            return;
        }

        if (value instanceof String text && !text.isBlank()) {
            ips.add(text);
            return;
        }

        if (value instanceof Iterable<?> items) {
            for (Object item : items) {
                collectIps(item, ips);
            }
            return;
        }

        if (value instanceof Map<?, ?> map) {
            collectIps(map.get("ips"), ips);
            collectIps(map.get("ip_list"), ips);
            collectIps(map.get("cities"), ips);
            collectIps(map.get("items"), ips);
            collectIps(map.get("proxies"), ips);
        }
    }

    private List<Map<String, Object>> unwrapArray(Object value) {
        List<Map<String, Object>> output = new ArrayList<>();
        unwrapArray(value, output);
        return output;
    }

    private void unwrapArray(Object value, List<Map<String, Object>> output) {
        if (value == null) {
            return;
        }

        if (value instanceof Iterable<?> items) {
            for (Object item : items) {
                if (item instanceof Map<?, ?> map) {
                    output.add(copyMap(map));
                }
            }
            return;
        }

        if (value instanceof Map<?, ?> map) {
            for (String key : List.of(
                    "payload",
                    "data",
                    "store",
                    "packages",
                    "products",
                    "items",
                    "servers",
                    "proxies",
                    "lines",
                    "orders"
            )) {
                Object candidate = map.get(key);
                int before = output.size();
                unwrapArray(candidate, output);
                if (output.size() > before) {
                    return;
                }
            }
        }
    }

    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return copyMap(map);
        }
        return Map.of();
    }

    private Map<String, Object> copyMap(Map<?, ?> source) {
        Map<String, Object> copy = new HashMap<>();
        source.forEach((key, value) -> {
            if (key != null) {
                copy.put(key.toString(), value);
            }
        });
        return copy;
    }

    private Object firstPresent(Map<String, Object> values, String... keys) {
        if (values == null) {
            return null;
        }

        for (String key : keys) {
            Object value = values.get(key);
            if (value != null && !value.toString().isBlank()) {
                return value;
            }
        }

        return null;
    }

    private String firstString(Map<String, Object> values, String... keys) {
        Object value = firstPresent(values, keys);
        return value == null ? null : value.toString();
    }

    private int firstIntOrDefault(Map<String, Object> values, int fallback, String... keys) {
        Integer value = firstIntOrNull(values, null, keys);
        return value == null ? fallback : value;
    }

    private Integer firstIntOrNull(Map<String, Object> values, Integer fallback, String... keys) {
        Object value = firstPresent(values, keys);
        if (value == null) {
            return fallback;
        }

        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException error) {
            return fallback;
        }
    }

    private Integer requestInt(Map<String, Object> request, String key, Integer fallback) {
        return firstIntOrNull(request, fallback, key);
    }

    private BigDecimal firstBigDecimal(Map<String, Object> values, String... keys) {
        Object value = firstPresent(values, keys);
        if (value == null) {
            return BigDecimal.ZERO;
        }

        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException error) {
            return BigDecimal.ZERO;
        }
    }

    private boolean requestBoolean(Map<String, Object> request, String key) {
        Object value = request.get(key);
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(value.toString());
    }

    private String normalizeProxyType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return switch (value.toLowerCase(Locale.ROOT)) {
            case "gresidential", "standard residential", "residential" -> "gResidential";
            case "resix", "premium residential" -> "resix";
            case "unlimitedresidential", "unlimited residential" -> "UnlimitedResidential";
            case "isp", "static isp" -> "Isp";
            case "ispp", "dedicated isp" -> "IspP";
            case "datacenterp", "datacenter" -> "DatacenterP";
            case "ipv6p", "ipv6" -> "Ipv6p";
            case "rotatingmobile", "mobile", "rotating mobile" -> "RotatingMobile";
            default -> value;
        };
    }

    private boolean isIsp(String proxyType) {
        return Objects.equals(proxyType, "Isp") || Objects.equals(proxyType, "IspP");
    }

    private int defaultPort(String proxyType) {
        return switch (proxyType == null ? "" : proxyType) {
            case "gResidential" -> 9000;
            case "resix" -> 6011;
            case "UnlimitedResidential" -> 8080;
            case "DatacenterP", "Ipv6p" -> 1338;
            case "RotatingMobile" -> 5000;
            default -> 0;
        };
    }
}

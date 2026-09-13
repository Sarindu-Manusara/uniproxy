package com.example.uniproxy.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CatProxiesCatalogTests {
    @Test
    void collectsAllStorePagesAndPreservesResponseEnvelope() {
        CatProxiesApiService service = new CatProxiesApiService();
        RestTemplate rest = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        ReflectionTestUtils.setField(service, "apiBaseUrl", "https://provider.test/api");
        ReflectionTestUtils.setField(service, "apiKey", "test-key");
        MockRestServiceServer server = MockRestServiceServer.bindTo(rest).build();
        for (int page = 1; page <= 2; page++) {
            int expectedPage = page;
            server.expect(request -> {
                assertTrue(request.getURI().getQuery().contains("page=" + expectedPage));
                assertTrue(request.getURI().getQuery().contains("pageSize=100"));
                assertTrue(request.getURI().getQuery().contains("proxyType=DatacenterP"));
                assertEquals("Bearer test-key", request.getHeaders().getFirst("Authorization"));
            }).andRespond(withSuccess("{\"message\":\"Success\",\"payload\":{\"products\":[{\"packageId\":\"p" + page + "\"}]},\"pagination\":{\"totalPages\":2}}", MediaType.APPLICATION_JSON));
        }
        Map<?, ?> response = (Map<?, ?>) service.getStore("DatacenterP");
        Map<?, ?> payload = (Map<?, ?>) response.get("payload");
        assertEquals(List.of(Map.of("packageId", "p1"), Map.of("packageId", "p2")), payload.get("products"));
        assertEquals("Success", response.get("message"));
        server.verify();
    }
}

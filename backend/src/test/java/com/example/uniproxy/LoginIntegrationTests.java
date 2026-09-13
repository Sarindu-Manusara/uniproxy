package com.example.uniproxy;

import com.example.uniproxy.config.JwtUtils;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {"debug=false", "spring.jpa.properties.hibernate.generate_statistics=true"})
@ActiveProfiles("local")
@AutoConfigureMockMvc
class LoginIntegrationTests {
    @Autowired
    private MockMvc mvc;
    @Autowired
    private UserRepository users;
    @Autowired
    private BCryptPasswordEncoder encoder;
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private static final String LOGIN = """
            {"username":"login-test","password":"test-password"}
            """;

    @BeforeEach
    void createAccount() {
        User user = users.findByUsername("login-test").orElseGet(User::new);
        user.setUsername("login-test");
        user.setEmail("login-test@example.test");
        user.setPassword(encoder.encode("test-password"));
        user.setRole("USER");
        user.setBalance(new BigDecimal("12.50"));
        users.saveAndFlush(user);
        entityManagerFactory.unwrap(SessionFactory.class).getStatistics().clear();
    }

    @Test
    void loginReturnsProfileWithOnlyOneDatabaseQuery() throws Exception {
        mvc.perform(post("/api/auth/login").param("includeProfile", "true")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.profile.username").value("login-test"))
                .andExpect(jsonPath("$.profile.role").value("USER"))
                .andExpect(jsonPath("$.profile.balance").value(12.5))
                .andExpect(jsonPath("$.profile.password").doesNotExist())
                .andExpect(content().string(not(containsString("$2a$"))));

        assertEquals(1, entityManagerFactory.unwrap(SessionFactory.class)
                .getStatistics().getPrepareStatementCount());
    }

    @Test
    void legacyLoginStillReturnsAWorkingToken() throws Exception {
        String token = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        assertEquals("login-test", jwtUtils.getClaimsFromToken(token).getSubject());
        mvc.perform(get("/api/user/profile").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("login-test"));
    }

    @Test
    void wrongPasswordCannotStartASession() throws Exception {
        mvc.perform(post("/api/auth/login").param("includeProfile", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"login-test","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void changedPasswordTakesEffectImmediately() throws Exception {
        User user = users.findByUsername("login-test").orElseThrow();
        user.setPassword(encoder.encode("new-password"));
        users.saveAndFlush(user);

        mvc.perform(post("/api/auth/login").param("includeProfile", "true")
                        .contentType(MediaType.APPLICATION_JSON).content(LOGIN))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").param("includeProfile", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"login-test","password":"new-password"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void malformedTokenAndUserTokenCannotAccessAdminRoutes() throws Exception {
        mvc.perform(get("/api/user/profile").header("Authorization", "Bearer malformed"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtUtils.generateToken("login-test", "USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void expiredAndIncorrectlySignedTokensAreRejected() throws Exception {
        String expired = new JwtUtils(jwtSecret, -1000).generateToken("login-test", "USER");
        String forged = new JwtUtils("a-different-signing-key-for-this-test-only", 60000)
                .generateToken("login-test", "ADMIN");
        for (String token : new String[] {expired, forged}) {
            mvc.perform(get("/api/user/profile").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void adminTokenKeepsItsRole() throws Exception {
        mvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + jwtUtils.generateToken("login-test", "ADMIN")))
                .andExpect(status().isOk());
    }
}

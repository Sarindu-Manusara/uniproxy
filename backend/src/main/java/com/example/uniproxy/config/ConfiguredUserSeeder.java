package com.example.uniproxy.config;

import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class ConfiguredUserSeeder {

    @Bean
    CommandLineRunner seedConfiguredUsers(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            Environment environment
    ) {
        return args -> {
            seedUserFromEnvironment(userRepository, passwordEncoder, environment, "APP_SEED_USER", "USER");
            seedUserFromEnvironment(userRepository, passwordEncoder, environment, "APP_SEED_ADMIN", "ADMIN");
        };
    }

    private void seedUserFromEnvironment(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            Environment environment,
            String prefix,
            String role
    ) {
        String username = environment.getProperty(prefix + "_USERNAME", "");
        String email = environment.getProperty(prefix + "_EMAIL", "");
        String password = environment.getProperty(prefix + "_PASSWORD", "");

        if (username.isBlank() || email.isBlank() || password.isBlank()) {
            return;
        }

        userRepository.findByUsername(username).ifPresentOrElse(user -> {
            boolean changed = false;
            if (!passwordEncoder.matches(password, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(password));
                changed = true;
            }
            if (!email.equals(user.getEmail())) {
                user.setEmail(email);
                changed = true;
            }
            if (!role.equals(user.getRole())) {
                user.setRole(role);
                changed = true;
            }
            if (user.getBalance() == null) {
                user.setBalance(BigDecimal.ZERO);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        }, () -> {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role);
            user.setBalance(BigDecimal.ZERO);
            userRepository.save(user);
        });
    }
}

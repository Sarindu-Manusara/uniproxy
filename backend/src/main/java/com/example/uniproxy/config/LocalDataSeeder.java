package com.example.uniproxy.config;

import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
@Profile("local")
public class LocalDataSeeder {

    @Bean
    CommandLineRunner seedLocalUsers(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            seedUser(userRepository, passwordEncoder, "demo", "demo@example.com", "demo1234", "USER");
            seedUser(userRepository, passwordEncoder, "admin", "admin@example.com", "admin1234", "ADMIN");
        };
    }

    private void seedUser(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            String username,
            String email,
            String password,
            String role
    ) {
        userRepository.findByUsername(username).ifPresentOrElse(user -> {
            boolean changed = false;
            if (!passwordEncoder.matches(password, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(password));
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

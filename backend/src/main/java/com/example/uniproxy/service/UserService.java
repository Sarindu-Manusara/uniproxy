package com.example.uniproxy.service;

import com.example.uniproxy.config.JwtUtils;
import com.example.uniproxy.dto.LoginRequest;
import com.example.uniproxy.dto.UserRegistrationRequest;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // 1. Register User Method
    public String registerUser(UserRegistrationRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return "Username already exists!";
        }

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setBalance(BigDecimal.ZERO);

        userRepository.save(newUser);
        return "User registered successfully!";
    }


    public String login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return jwtUtils.generateToken(user.getUsername(), user.getRole());
        } else {
            throw new RuntimeException("Invalid password");
        }
    }
}
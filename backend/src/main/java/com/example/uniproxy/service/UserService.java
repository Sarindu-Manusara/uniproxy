package com.example.uniproxy.service;

import com.example.uniproxy.config.JwtUtils;
import com.example.uniproxy.dto.LoginRequest;
import com.example.uniproxy.dto.LoginResponse;
import com.example.uniproxy.dto.UserProfileResponse;
import com.example.uniproxy.dto.UserRegistrationRequest;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
        return loginWithProfile(request).token();
    }

    public LoginResponse loginWithProfile(LoginRequest request) {
        if (request.getUsername() == null || request.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password are required");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        return new LoginResponse(
                jwtUtils.generateToken(user.getUsername(), user.getRole()),
                new UserProfileResponse(user.getUsername(), user.getEmail(), user.getBalance(), user.getRole())
        );
    }
}

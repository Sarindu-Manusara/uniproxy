package com.example.uniproxy.controller;

import com.example.uniproxy.dto.TransactionResponse;
import com.example.uniproxy.dto.UserProfileResponse;
import com.example.uniproxy.model.User;
import com.example.uniproxy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/profile")
    public UserProfileResponse getUserProfile() {
        // Token eken logged-in user wa hoyagannawa
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Dashboard ekata ona details tika witharak return karanawa
        return new UserProfileResponse(
                user.getUsername(),
                user.getEmail(),
                user.getBalance(),
                user.getRole()
        );
    }
    @Autowired
    private com.example.uniproxy.repository.TransactionRepository transactionRepository;

    @GetMapping("/transactions")
    public List<TransactionResponse> getMyTransactions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // User ට අදාළ සියලුම transactions අරන් DTO එකකට convert කරනවා
        return transactionRepository.findAll().stream()
                .filter(tx -> tx.getUser().getId().equals(user.getId()))
                .map(tx -> new com.example.uniproxy.dto.TransactionResponse(
                        tx.getPaymentId(),
                        tx.getAmount(),
                        tx.getStatus(),
                        tx.getCreatedAt()
                ))
                .collect(java.util.stream.Collectors.toList());
    }
    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/update-password")
    public String updatePassword(@RequestBody com.example.uniproxy.dto.UpdatePasswordRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Check if the old password matches
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return "Error: Current password is incorrect.";
        }

        // 2. Encrypt and save the new password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return "Success: Password updated successfully.";
    }
}
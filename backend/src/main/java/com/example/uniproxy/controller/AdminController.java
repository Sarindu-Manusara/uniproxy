package com.example.uniproxy.controller;

import com.example.uniproxy.model.User;
import com.example.uniproxy.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/revenue")
    public String getRevenue() {
        BigDecimal total = paymentService.getTotalRevenue();
        return "Total Revenue Collected: $" + total;
    }
    @Autowired
    private com.example.uniproxy.repository.UserRepository userRepository;

    @GetMapping("/users")
    public List<User> getAllUsers() {
        // list of all users
        return userRepository.findAll();
    }
}
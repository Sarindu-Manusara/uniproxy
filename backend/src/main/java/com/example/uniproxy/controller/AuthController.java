package com.example.uniproxy.controller;

import com.example.uniproxy.dto.LoginRequest;
import com.example.uniproxy.dto.UserRegistrationRequest;
import com.example.uniproxy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    // Register Endpoint
    @PostMapping("/register")
    public String register(@RequestBody UserRegistrationRequest request) {
        return userService.registerUser(request);
    }

    // Login Endpoint
    @PostMapping("/login")
    public Object login(@RequestBody LoginRequest request,
                        @RequestParam(defaultValue = "false") boolean includeProfile) {
        return includeProfile ? userService.loginWithProfile(request) : userService.login(request);
    }
    @GetMapping("/test-secure")
    public String testSecure() {
        return "Can only see this who have the token!";
    }
}

package com.example.uniproxy.dto;

public record LoginResponse(String token, UserProfileResponse profile) {
}

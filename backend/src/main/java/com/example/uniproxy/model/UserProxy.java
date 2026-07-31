package com.example.uniproxy.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_proxies")
@Data
public class UserProxy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ip;
    private int port;
    private String proxyUsername;
    private String proxyPassword;
    private LocalDateTime expiryDate;
    private String provider;
    private String providerOrderId;
    private String packageId;
    private String packageName;
    private String proxyType;
    private String protocol;
    private String providerStatus;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}

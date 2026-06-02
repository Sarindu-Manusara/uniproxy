package com.example.uniproxy.service;

import com.example.uniproxy.model.User;
import com.example.uniproxy.model.UserProxy;
import com.example.uniproxy.repository.UserRepository;
import com.example.uniproxy.repository.UserProxyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class ProxyService {

    @Autowired
    private UserProxyRepository userProxyRepository;

    @Autowired
    private UserRepository userRepository;

    public String purchaseProxy(User user, BigDecimal price) {
        // 1. Check if user has enough balance
        if (user.getBalance().compareTo(price) < 0) {
            return "Error: Insufficient balance.";
        }

        // 2. Deduct balance
        user.setBalance(user.getBalance().subtract(price));
        userRepository.save(user);

        // 3. Mock CatProxies API Call (Integrate real API here later)
        UserProxy proxy = new UserProxy();
        proxy.setIp("192.168.1.100");
        proxy.setPort(8080);
        proxy.setProxyUsername("proxy_user");
        proxy.setProxyPassword("proxy_pass");
        proxy.setExpiryDate(LocalDateTime.now().plusDays(30));
        proxy.setUser(user);

        userProxyRepository.save(proxy);

        return "Success: Proxy purchased successfully.";
    }
}
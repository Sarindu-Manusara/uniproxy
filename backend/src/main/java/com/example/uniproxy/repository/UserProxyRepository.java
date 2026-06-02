package com.example.uniproxy.repository;

import com.example.uniproxy.model.User;
import com.example.uniproxy.model.UserProxy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserProxyRepository extends JpaRepository<UserProxy, Long> {

    // Finds all proxies purchased by a specific user
    List<UserProxy> findByUser(User user);

    // You can add more custom queries here later,
    // like finding proxies by expiry date.
}
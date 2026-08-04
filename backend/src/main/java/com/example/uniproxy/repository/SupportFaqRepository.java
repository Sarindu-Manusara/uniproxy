package com.example.uniproxy.repository;

import com.example.uniproxy.model.SupportFaq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupportFaqRepository extends JpaRepository<SupportFaq, Long> {
    List<SupportFaq> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<SupportFaq> findAllByOrderBySortOrderAscIdAsc();
}

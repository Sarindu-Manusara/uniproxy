package com.example.uniproxy.controller;

import com.example.uniproxy.dto.SupportFaqResponse;
import com.example.uniproxy.repository.SupportFaqRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/support/faqs")
public class SupportFaqController {
    private final SupportFaqRepository supportFaqRepository;

    public SupportFaqController(SupportFaqRepository supportFaqRepository) {
        this.supportFaqRepository = supportFaqRepository;
    }

    @GetMapping
    public List<SupportFaqResponse> getActiveFaqs() {
        return supportFaqRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(SupportFaqResponse::from)
                .toList();
    }
}

package com.example.uniproxy.controller;

import com.example.uniproxy.dto.SupportFaqRequest;
import com.example.uniproxy.dto.SupportFaqResponse;
import com.example.uniproxy.model.SupportFaq;
import com.example.uniproxy.repository.SupportFaqRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/faqs")
public class AdminSupportFaqController {
    private final SupportFaqRepository supportFaqRepository;

    public AdminSupportFaqController(SupportFaqRepository supportFaqRepository) {
        this.supportFaqRepository = supportFaqRepository;
    }

    @GetMapping
    public List<SupportFaqResponse> getFaqs() {
        return supportFaqRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(SupportFaqResponse::from)
                .toList();
    }

    @PostMapping
    public SupportFaqResponse createFaq(@RequestBody SupportFaqRequest request) {
        SupportFaq faq = new SupportFaq();
        applyRequest(faq, request);
        return SupportFaqResponse.from(supportFaqRepository.save(faq));
    }

    @PutMapping("/{id}")
    public SupportFaqResponse updateFaq(
            @PathVariable Long id,
            @RequestBody SupportFaqRequest request
    ) {
        SupportFaq faq = supportFaqRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found"));
        applyRequest(faq, request);
        return SupportFaqResponse.from(supportFaqRepository.save(faq));
    }

    @DeleteMapping("/{id}")
    public void deleteFaq(@PathVariable Long id) {
        if (!supportFaqRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ not found");
        }
        supportFaqRepository.deleteById(id);
    }

    private void applyRequest(SupportFaq faq, SupportFaqRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FAQ details are required");
        }

        String question = request.getQuestion() == null ? "" : request.getQuestion().trim();
        String answer = request.getAnswer() == null ? "" : request.getAnswer().trim();

        if (question.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question is required");
        }

        if (answer.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Answer is required");
        }

        faq.setQuestion(question);
        faq.setAnswer(answer);
        faq.setActive(request.getActive() == null || request.getActive());
        faq.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
    }
}

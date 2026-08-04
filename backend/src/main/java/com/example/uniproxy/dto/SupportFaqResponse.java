package com.example.uniproxy.dto;

import com.example.uniproxy.model.SupportFaq;
import lombok.Data;

@Data
public class SupportFaqResponse {
    private Long id;
    private String question;
    private String answer;
    private boolean active;
    private int sortOrder;

    public static SupportFaqResponse from(SupportFaq faq) {
        SupportFaqResponse response = new SupportFaqResponse();
        response.setId(faq.getId());
        response.setQuestion(faq.getQuestion());
        response.setAnswer(faq.getAnswer());
        response.setActive(faq.isActive());
        response.setSortOrder(faq.getSortOrder());
        return response;
    }
}

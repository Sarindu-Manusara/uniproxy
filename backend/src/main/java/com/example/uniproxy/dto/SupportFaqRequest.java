package com.example.uniproxy.dto;

import lombok.Data;

@Data
public class SupportFaqRequest {
    private String question;
    private String answer;
    private Boolean active;
    private Integer sortOrder;
}

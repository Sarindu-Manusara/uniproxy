package com.example.uniproxy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Data;

@Entity
@Table(name = "content_migrations")
@Data
public class ContentMigration {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false)
    private LocalDateTime appliedAt;

    @PrePersist
    void onCreate() {
        if (appliedAt == null) {
            appliedAt = LocalDateTime.now();
        }
    }
}

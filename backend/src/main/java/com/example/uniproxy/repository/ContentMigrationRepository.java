package com.example.uniproxy.repository;

import com.example.uniproxy.model.ContentMigration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentMigrationRepository extends JpaRepository<ContentMigration, String> {
}

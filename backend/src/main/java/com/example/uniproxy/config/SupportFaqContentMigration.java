package com.example.uniproxy.config;

import com.example.uniproxy.model.ContentMigration;
import com.example.uniproxy.model.SupportFaq;
import com.example.uniproxy.repository.ContentMigrationRepository;
import com.example.uniproxy.repository.SupportFaqRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(20)
public class SupportFaqContentMigration implements CommandLineRunner {
    static final String MIGRATION_ID = "support-faqs-2026-09-14";

    private final SupportFaqRepository supportFaqRepository;
    private final ContentMigrationRepository contentMigrationRepository;

    public SupportFaqContentMigration(
            SupportFaqRepository supportFaqRepository,
            ContentMigrationRepository contentMigrationRepository
    ) {
        this.supportFaqRepository = supportFaqRepository;
        this.contentMigrationRepository = contentMigrationRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (contentMigrationRepository.existsById(MIGRATION_ID)) {
            return;
        }

        supportFaqRepository.deleteAllInBatch();
        supportFaqRepository.saveAll(defaultFaqs());

        ContentMigration migration = new ContentMigration();
        migration.setId(MIGRATION_ID);
        contentMigrationRepository.save(migration);
    }

    static List<SupportFaq> defaultFaqs() {
        return List.of(
                faq(
                        "Can I keep the same IP for a session?",
                        "Yes. Sticky sessions can preserve the same IP for multi-step workflows, while rotation is available when you need fresh IPs.",
                        10
                ),
                faq(
                        "Do you accept Monero (XMR)?",
                        "Yes we currently accept Monero, Zcash and other crypto.",
                        20
                ),
                faq(
                        "What is a proxy server?",
                        "A proxy server is an intermediary that routes your internet traffic through a different IP address, hiding your real one so you can access sites without geographic or rate-limit restrictions.",
                        30
                ),
                faq(
                        "Can I select specific countries?",
                        "Country targeting is available in the dashboard, with room to expand into cities and states.",
                        40
                )
        );
    }

    private static SupportFaq faq(String question, String answer, int sortOrder) {
        SupportFaq faq = new SupportFaq();
        faq.setQuestion(question);
        faq.setAnswer(answer);
        faq.setSortOrder(sortOrder);
        faq.setActive(true);
        return faq;
    }
}

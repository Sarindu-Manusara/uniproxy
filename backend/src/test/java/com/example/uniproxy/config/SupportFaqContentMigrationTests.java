package com.example.uniproxy.config;

import com.example.uniproxy.model.ContentMigration;
import com.example.uniproxy.model.SupportFaq;
import com.example.uniproxy.repository.ContentMigrationRepository;
import com.example.uniproxy.repository.SupportFaqRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SupportFaqContentMigrationTests {
    private final SupportFaqRepository faqs = mock(SupportFaqRepository.class);
    private final ContentMigrationRepository migrations = mock(ContentMigrationRepository.class);
    private final SupportFaqContentMigration migration = new SupportFaqContentMigration(faqs, migrations);

    @Test
    void replacesExistingFaqsOnceWithThePublishedQuestions() {
        when(migrations.existsById(SupportFaqContentMigration.MIGRATION_ID)).thenReturn(false);

        migration.run();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SupportFaq>> faqCaptor = ArgumentCaptor.forClass(List.class);
        verify(faqs).deleteAllInBatch();
        verify(faqs).saveAll(faqCaptor.capture());
        verify(migrations).save(any(ContentMigration.class));

        List<SupportFaq> saved = faqCaptor.getValue();
        assertEquals(4, saved.size());
        assertEquals("Can I keep the same IP for a session?", saved.get(0).getQuestion());
        assertEquals("Do you accept Monero (XMR)?", saved.get(1).getQuestion());
        assertEquals("What is a proxy server?", saved.get(2).getQuestion());
        assertEquals("Can I select specific countries?", saved.get(3).getQuestion());
        assertTrue(saved.stream().allMatch(SupportFaq::isActive));
    }

    @Test
    void preservesAdminEditsAfterTheMigrationWasApplied() {
        when(migrations.existsById(SupportFaqContentMigration.MIGRATION_ID)).thenReturn(true);

        migration.run();

        verify(faqs, never()).deleteAllInBatch();
        verify(faqs, never()).saveAll(any());
        verify(migrations, never()).save(any());
    }
}

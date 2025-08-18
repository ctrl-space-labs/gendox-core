package dev.ctrlspace.gendox.spring.batch.backfill;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BackfillPagesServiceTest {

    @Mock
    private JdbcTemplate jdbc;

    @Mock
    private DocumentPageCounter pageCounter;

    private BackfillPagesService service;

    @BeforeEach
    void setUp() {
        service = new BackfillPagesService(jdbc, pageCounter);
        ReflectionTestUtils.setField(service, "batchSize", 2);
    }

    @Test
    void shouldProcessDocumentsSuccessfully() throws Exception {
        // Given
        UUID doc1Id = UUID.randomUUID();
        UUID doc2Id = UUID.randomUUID();
        BackfillPagesService.Row row1 = new BackfillPagesService.Row(doc1Id, "http://example.com/doc1.pdf");
        BackfillPagesService.Row row2 = new BackfillPagesService.Row(doc2Id, "http://example.com/doc2.pdf");

        when(jdbc.query(anyString(), any(RowMapper.class), eq(2)))
            .thenReturn(Arrays.asList(row1, row2))
            .thenReturn(Collections.emptyList());

        when(pageCounter.count("http://example.com/doc1.pdf")).thenReturn(10);
        when(pageCounter.count("http://example.com/doc2.pdf")).thenReturn(5);

        when(jdbc.update(contains("SET number_of_pages"), eq(10), eq(doc1Id))).thenReturn(1);
        when(jdbc.update(contains("SET number_of_pages"), eq(5), eq(doc2Id))).thenReturn(1);

        when(jdbc.queryForObject(contains("COUNT(*)"), eq(Long.class))).thenReturn(0L);

        // When
        service.runBackfill();

        // Then
        verify(jdbc, times(2)).update(contains("SET number_of_pages"), any(), any());
        verify(jdbc, never()).update(contains("SET page_count_error"), any(), any());
    }

    @Test
    void shouldRecordErrorOnFailure() throws Exception {
        // Given
        UUID docId = UUID.randomUUID();
        BackfillPagesService.Row row = new BackfillPagesService.Row(docId, "http://example.com/bad-doc.pdf");

        when(jdbc.query(anyString(), any(RowMapper.class), eq(2)))
            .thenReturn(Collections.singletonList(row))
            .thenReturn(Collections.emptyList());

        when(pageCounter.count("http://example.com/bad-doc.pdf"))
            .thenThrow(new RuntimeException("Document not found"));

        when(jdbc.update(contains("SET page_count_error"), eq("Document not found"), eq(docId))).thenReturn(1);
        when(jdbc.queryForObject(contains("COUNT(*)"), eq(Long.class))).thenReturn(0L);

        // When
        service.runBackfill();

        // Then
        verify(jdbc, never()).update(contains("SET number_of_pages"), any(), any());
        verify(jdbc).update(contains("SET page_count_error"), eq("Document not found"), eq(docId));
    }

    @Test
    void shouldSkipAlreadyProcessedDocuments() throws Exception {
        // Given
        UUID docId = UUID.randomUUID();
        BackfillPagesService.Row row = new BackfillPagesService.Row(docId, "http://example.com/doc.pdf");

        when(jdbc.query(anyString(), any(RowMapper.class), eq(2)))
            .thenReturn(Collections.singletonList(row))
            .thenReturn(Collections.emptyList());

        when(pageCounter.count("http://example.com/doc.pdf")).thenReturn(10);
        when(jdbc.update(contains("SET number_of_pages"), eq(10), eq(docId))).thenReturn(0); // Already processed
        when(jdbc.queryForObject(contains("COUNT(*)"), eq(Long.class))).thenReturn(0L);

        // When
        service.runBackfill();

        // Then
        verify(jdbc).update(contains("SET number_of_pages"), eq(10), eq(docId));
        verify(jdbc, never()).update(contains("SET page_count_error"), any(), any());
    }
}
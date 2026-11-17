package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AuditLogsService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.junit.jupiter.api.Test;
import org.springframework.batch.infrastructure.item.Chunk;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.step.StepExecution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The splitter reads the documents changed in its window page by page, while its writer stores
 * what it learned about every document it splits. Every document that was in the window when the
 * run started must still be read once: if storing a split moved the document's updatedAt past the
 * window (as saving the entity does, @LastModifiedDate), the next page's offset would skip documents.
 *
 * The documents live in a list that answers each page the way the database answers the query:
 * filtered by the window at the moment of the page request, ordered, then offset.
 */
class DocumentSplitterReaderPagingTest {

    private static final Instant NOW = Instant.parse("2026-11-16T10:00:00Z");
    private static final TimePeriodDTO WINDOW = new TimePeriodDTO(NOW.minusSeconds(3600), NOW);

    private final List<DocumentInstance> table = new ArrayList<>();

    @Test
    void everyChangedDocumentIsReadWhileTheWriterStoresTheSplits() throws Exception {
        for (int i = 0; i < 5; i++) {
            table.add(document(NOW.minusSeconds(600 - i)));
        }
        DocumentSplitterReader reader = readerOverTable(2);
        DocumentSplitterWriter writer = writerOverTable();

        List<UUID> read = new ArrayList<>();
        DocumentInstance next;
        while ((next = reader.read()) != null) {
            read.add(next.getId());
            // every document changed: the processor hands it to the writer with its new hash (chunk size 1)
            DocumentInstance split = copyOf(next);
            split.setDocumentSha256Hash("new-hash-" + read.size());
            writer.write(new Chunk<>(List.of(new DocumentSectionDTO(split, List.of("a section"), true))));
        }

        assertThat(read).containsExactlyInAnyOrderElementsOf(table.stream().map(DocumentInstance::getId).toList());
        assertThat(table).allSatisfy(d -> assertThat(d.getDocumentSha256Hash()).startsWith("new-hash-"));
    }

    @Test
    void everyDocumentIsReadWhenNothingIsSaved() throws Exception {
        // the same run with unchanged documents (skipped, so not saved): the control for the test above
        for (int i = 0; i < 5; i++) {
            table.add(document(NOW.minusSeconds(600 - i)));
        }
        DocumentSplitterReader reader = readerOverTable(2);

        List<UUID> read = new ArrayList<>();
        DocumentInstance next;
        while ((next = reader.read()) != null) {
            read.add(next.getId());
        }

        assertThat(read).hasSize(5);
    }

    private final DocumentService documentService = mock(DocumentService.class);

    /**
     * The real writer over the table. As in the database, saving an entity sets its updatedAt
     * (@LastModifiedDate); a bulk update sets only the columns it names.
     */
    private DocumentSplitterWriter writerOverTable() throws Exception {
        when(documentService.getDocumentInstanceById(any())).thenAnswer(invocation -> row(invocation.getArgument(0)));
        when(documentService.saveDocumentInstance(any())).thenAnswer(invocation -> {
            DocumentInstance saved = invocation.getArgument(0);
            DocumentInstance row = row(saved.getId());
            row.setDocumentSha256Hash(saved.getDocumentSha256Hash());
            row.setUpdatedAt(Instant.now().isAfter(NOW) ? Instant.now() : NOW.plusSeconds(1));
            return row;
        });
        doAnswer(invocation -> {
            DocumentInstance split = invocation.getArgument(0);
            row(split.getId()).setDocumentSha256Hash(split.getDocumentSha256Hash());
            return null;
        }).when(documentService).updateSplitResult(any());

        return new DocumentSplitterWriter(mock(DocumentSectionService.class), mock(TypeService.class),
                mock(AuditLogsService.class), documentService);
    }

    private DocumentInstance row(UUID id) {
        return table.stream().filter(d -> d.getId().equals(id)).findFirst().orElseThrow();
    }

    private static DocumentInstance copyOf(DocumentInstance document) {
        DocumentInstance copy = new DocumentInstance();
        copy.setId(document.getId());
        copy.setOrganizationId(document.getOrganizationId());
        copy.setUpdatedAt(document.getUpdatedAt());
        copy.setDocumentSha256Hash(document.getDocumentSha256Hash());
        return copy;
    }

    private DocumentSplitterReader readerOverTable(int pageSize) throws Exception {
        when(documentService.getAllDocuments(any(DocumentCriteria.class), any(Pageable.class)))
                .thenAnswer(invocation -> page(invocation.getArgument(0), invocation.getArgument(1)));

        DocumentInstanceCriteriaJobParamsConverter converter = new DocumentInstanceCriteriaJobParamsConverter();
        DocumentSplitterReader reader = new DocumentSplitterReader(documentService, converter);
        reader.setPageSize(pageSize);
        ReflectionTestUtils.setField(reader, "now", NOW);

        DocumentCriteria criteria = DocumentCriteria.builder().updatedBetween(WINDOW).build();
        JobParameters parameters = new JobParametersBuilder(converter.toDTO(criteria))
                .addString("now", NOW.toString())
                .toJobParameters();
        StepExecution stepExecution = mock(StepExecution.class);
        when(stepExecution.getJobParameters()).thenReturn(parameters);

        assertThat(reader.beforeStep(stepExecution)).as("the parameters are valid").isNull();
        return reader;
    }

    // WHERE updated_at BETWEEN from AND to ORDER BY updated_at OFFSET n LIMIT size, evaluated now
    private Page<DocumentInstance> page(DocumentCriteria criteria, Pageable pageable) {
        TimePeriodDTO window = criteria.getUpdatedBetween();
        List<DocumentInstance> matching = table.stream()
                .filter(d -> window == null || (!d.getUpdatedAt().isBefore(window.from()) && !d.getUpdatedAt().isAfter(window.to())))
                .sorted(Comparator.comparing(DocumentInstance::getUpdatedAt))
                .toList();
        int from = (int) Math.min(pageable.getOffset(), matching.size());
        int to = Math.min(from + pageable.getPageSize(), matching.size());
        return new PageImpl<>(new ArrayList<>(matching.subList(from, to)), pageable, matching.size());
    }

    private static DocumentInstance document(Instant updatedAt) {
        DocumentInstance document = new DocumentInstance();
        document.setId(UUID.randomUUID());
        document.setOrganizationId(UUID.randomUUID());
        document.setUpdatedAt(updatedAt);
        return document;
    }
}

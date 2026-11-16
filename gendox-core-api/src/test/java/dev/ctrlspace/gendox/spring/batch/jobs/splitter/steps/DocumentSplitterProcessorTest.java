package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import com.knuddels.jtokkit.Encodings;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
import jakarta.persistence.EntityManager;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The splitter's processor turns one document into its sections' text, or returns null for a
 * document that has not changed since it was last split (Spring Batch "filters" it).
 */
class DocumentSplitterProcessorTest {

    private final ProjectAgentService projectAgentService = mock(ProjectAgentService.class);
    private final ProjectService projectService = mock(ProjectService.class);
    private final DocumentDigitizationService digitizationService = mock(DocumentDigitizationService.class);
    private final DownloadService downloadService = mock(DownloadService.class);
    private final CryptographyUtils cryptographyUtils = mock(CryptographyUtils.class);
    private final SplitFileService splitFileService = mock(SplitFileService.class);

    private DocumentSplitterProcessor processor;
    private DocumentInstance document;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        processor = new DocumentSplitterProcessor(mock(ServiceSelector.class), projectAgentService, projectService,
                digitizationService, downloadService, mock(GendoxAPIIntegrationService.class), cryptographyUtils,
                mock(ApiKeyService.class), mock(OrganizationWebSiteService.class),
                Encodings.newDefaultEncodingRegistry(), splitFileService);
        ReflectionTestUtils.setField(processor, "entityManager", mock(EntityManager.class));
        ReflectionTestUtils.setField(processor, "skipUnchangedDocs", true);

        Type fileType = new Type();
        fileType.setName("PLAIN_TEXT_FILE");
        document = new DocumentInstance();
        document.setId(UUID.randomUUID());
        document.setOrganizationId(UUID.randomUUID());
        document.setRemoteUrl("file:/storage/report.pdf");
        document.setFileType(fileType);
        document.setDocumentSha256Hash("hash-of-the-last-split");

        Path file = Files.writeString(tempDir.resolve("report.pdf"), "content");
        when(downloadService.downloadToTemp(anyString(), anyString())).thenReturn(file);
        when(downloadService.readDocumentContent(anyString(), any())).thenReturn("plain text");
        when(digitizationService.digitizeDocumentToText(any(), any(), anyString(), any())).thenReturn("digitized text");
        when(cryptographyUtils.calculateSHA256(any(Path.class))).thenReturn("hash-of-the-file");
        when(cryptographyUtils.calculateSHA256(anyString())).thenReturn("hash-of-the-text");
        when(splitFileService.splitDocument(any(), anyString())).thenReturn(List.of("a section"));
    }

    @Test
    @Disabled("Ticket: a failed document is skipped silently and the next run starts after it. Fixing it needs a decision on retries (the run's window must not move past a failure).")
    void aDocumentThatCouldNotBeReadIsNotTreatedAsUnchanged() throws Exception {
        // null would mean "unchanged, nothing to do": the run would end COMPLETED and never look at it again
        reset(downloadService);
        when(downloadService.downloadToTemp(anyString(), anyString()))
                .thenThrow(new GendoxException("DOWNLOAD_FAILED", "storage unavailable", HttpStatus.SERVICE_UNAVAILABLE));
        ReflectionTestUtils.setField(processor, "projectIdParam", UUID.randomUUID().toString());

        assertThrows(Exception.class, () -> processor.process(document));
    }

    @Test
    @Disabled("Ticket: same as aDocumentThatCouldNotBeReadIsNotTreatedAsUnchanged.")
    void aDocumentWhoseSplittingFailedIsNotTreatedAsUnchanged() throws Exception {
        when(splitFileService.splitDocument(any(), anyString()))
                .thenThrow(new GendoxException("SPLIT_FAILED", "parser error", HttpStatus.INTERNAL_SERVER_ERROR));
        ReflectionTestUtils.setField(processor, "projectIdParam", UUID.randomUUID().toString());

        assertThrows(Exception.class, () -> processor.process(document));
    }

    @Test
    void aRunForOneProjectDigitizesTheDocumentsOfAnAgentThatDigitizes() throws Exception {
        // the control for the test below
        UUID projectId = UUID.randomUUID();
        digitizingAgent();
        ReflectionTestUtils.setField(processor, "projectIdParam", projectId.toString());

        processor.process(document);

        verify(digitizationService).digitizeDocumentToText(eq(document), any(), anyString(), any());
    }

    @Test
    void aRunForAllProjectsSplitsTheDocuments() throws Exception {
        // integrations (git, S3, websites) start runs for all projects, and the job passes this
        // value as projectId (DocumentInstanceCriteriaJobParamsConverter)
        ProjectAgent agent = new ProjectAgent();
        agent.setAutoDigitization(false);
        when(projectAgentService.getAgentByDocumentId(any())).thenReturn(agent);
        ReflectionTestUtils.setField(processor, "projectIdParam", JobExecutionParamConstants.ALL_PROJECTS);

        DocumentSectionDTO split = processor.process(document);

        assertNotNull(split, "the document is split, not skipped");
        verify(splitFileService).splitDocument(eq(document), anyString());
    }

    @Test
    void aRunForAllProjectsDigitizesTheDocumentsOfAnAgentThatDigitizes() throws Exception {
        // the same document must be read the same way in both kinds of run
        digitizingAgent();
        ReflectionTestUtils.setField(processor, "projectIdParam", JobExecutionParamConstants.ALL_PROJECTS);

        processor.process(document);

        verify(digitizationService).digitizeDocumentToText(eq(document), any(), anyString(), any());
    }

    private void digitizingAgent() {
        ProjectAgent agent = new ProjectAgent();
        agent.setAutoDigitization(true);
        when(projectAgentService.getAgentByProjectId(any())).thenReturn(agent);
        when(projectAgentService.getAgentByDocumentId(any())).thenReturn(agent);
    }
}

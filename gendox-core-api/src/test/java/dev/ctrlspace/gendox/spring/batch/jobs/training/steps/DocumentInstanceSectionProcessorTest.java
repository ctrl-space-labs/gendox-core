package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectAgentService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The training processor asks the embedding model for a section's vector, or returns null when the
 * section already has a vector for the same text (Spring Batch "filters" it).
 */
class DocumentInstanceSectionProcessorTest {

    @Test
    @Disabled("Ticket: a section the model could not embed is skipped silently and the next run starts after it. Fixing it needs a decision on retries.")
    void aSectionTheModelCouldNotEmbedIsNotTreatedAsAlreadyEmbedded() throws Exception {
        // null would mean "already embedded": the run would end COMPLETED, its window would move on,
        // and the section would stay unsearchable with nothing to show for it
        EmbeddingService embeddingService = mock(EmbeddingService.class);
        ProjectAgentService projectAgentService = mock(ProjectAgentService.class);
        TemplateRepository templateRepository = mock(TemplateRepository.class);
        CryptographyUtils cryptographyUtils = mock(CryptographyUtils.class);
        DocumentUtils documentUtils = mock(DocumentUtils.class);

        ProjectAgent agent = new ProjectAgent();
        agent.setSectionTemplateId(UUID.randomUUID());
        agent.setSemanticSearchModel(new AiModel());
        Template template = new Template();
        template.setText("{{sectionText}}");
        when(projectAgentService.getAgentByDocumentId(any())).thenReturn(agent);
        when(templateRepository.findByIdIs(any())).thenReturn(template);
        when(documentUtils.extractDocumentNameFromUrl(any())).thenReturn("report");
        when(cryptographyUtils.calculateSHA256(anyString())).thenReturn("hash");
        when(embeddingService.getEmbeddingForMessage(any(ProjectAgent.class), anyString(), any()))
                .thenThrow(new GendoxException("EMBEDDING_FAILED", "rate limited", HttpStatus.TOO_MANY_REQUESTS));

        DocumentInstance document = new DocumentInstance();
        document.setId(UUID.randomUUID());
        document.setRemoteUrl("file:/storage/report.pdf");
        DocumentInstanceSection section = new DocumentInstanceSection();
        section.setId(UUID.randomUUID());
        section.setDocumentInstance(document);
        section.setSectionValue("The method of least squares.");

        DocumentInstanceSectionProcessor processor = new DocumentInstanceSectionProcessor(embeddingService,
                mock(ProjectAgentRepository.class), templateRepository, cryptographyUtils, documentUtils, projectAgentService);

        assertThrows(Exception.class, () -> processor.process(section));
    }
}

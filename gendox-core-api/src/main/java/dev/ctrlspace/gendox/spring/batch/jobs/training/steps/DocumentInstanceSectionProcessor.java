package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Get Embeddings for each project that the section belongs.
 * This can run in parallel
 *
 */
@Component
@StepScope
public class DocumentInstanceSectionProcessor implements ItemProcessor<DocumentInstanceSection, SectionEmbeddingDTO> {
    Logger logger = LoggerFactory.getLogger(DocumentInstanceSectionProcessor.class);

    private EmbeddingService embeddingService;

    private ProjectService projectService;

    private ProjectAgentRepository projectAgentRepository;
    @Autowired
    public DocumentInstanceSectionProcessor(EmbeddingService embeddingService,
                                            ProjectAgentRepository projectAgentRepository) {
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
    }



    @Override
    public SectionEmbeddingDTO process(DocumentInstanceSection item) throws Exception {
        logger.debug("Start processing section: {}", item.getId());
        ProjectAgent projectAgent = projectAgentRepository.findAgentByDocumentInstanceId(item.getDocumentInstance().getId())
                .orElse(null);
        EmbeddingResponse embeddingResponse;
        try {
            embeddingResponse = embeddingService.getEmbeddingForMessage(item.getSectionValue(), projectAgent.getSemanticSearchModel().getModel());
        } catch (Exception e) {
            logger.warn("Error {} getting Embedding for section {}. Skipping...", e.getMessage(), item.getId());
            return null;
        }
        logger.debug("Section processed with cost: {} tokens", embeddingResponse.getUsage().getTotalTokens());
        return new SectionEmbeddingDTO(item, embeddingResponse);
    }


}

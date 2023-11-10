package dev.ctrlspace.gendox.etljobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
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

    @Autowired
    public DocumentInstanceSectionProcessor(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Override
    public SectionEmbeddingDTO process(DocumentInstanceSection item) throws Exception {
        logger.debug("Start processing section: {}", item.getId());
        Ada2Response ada2Response = embeddingService.getAda2EmbeddingForMessage(item.getSectionValue());
        logger.debug("Section processed with cost: {} tokens", ada2Response.getUsage().getTotalTokens());
        return new SectionEmbeddingDTO(item, ada2Response);
    }


}

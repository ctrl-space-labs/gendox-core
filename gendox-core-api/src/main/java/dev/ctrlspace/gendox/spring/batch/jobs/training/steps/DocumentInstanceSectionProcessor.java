package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Template;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.EmbeddingTemplateAuthor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;

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

    private DocumentSectionService documentSectionService;

    private ProjectAgentRepository projectAgentRepository;

    private TemplateRepository templateRepository;

    private CryptographyUtils cryptographyUtils;


    @Value("#{jobParameters['reuseEmbeddings']}")
    protected Boolean reuseEmbeddings;



    @Autowired
    public DocumentInstanceSectionProcessor(EmbeddingService embeddingService,
                                            ProjectAgentRepository projectAgentRepository,
                                            DocumentSectionService documentSectionService,
                                            TemplateRepository templateRepository,
                                            CryptographyUtils cryptographyUtils) {
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.documentSectionService = documentSectionService;
        this.templateRepository = templateRepository;
        this.cryptographyUtils = cryptographyUtils;
    }



    @Override
    public SectionEmbeddingDTO process(DocumentInstanceSection item) throws Exception {
        logger.debug("Start processing section: {}", item.getId());
        ProjectAgent projectAgent = projectAgentRepository.findAgentByDocumentInstanceId(item.getDocumentInstance().getId())
                .orElse(null);
        EmbeddingResponse embeddingResponse;
        try {

            Template agentSectionTemplate = templateRepository.findByIdIs(projectAgent.getSectionTemplateId());

            EmbeddingTemplateAuthor embeddingTemplateAuthor = new EmbeddingTemplateAuthor();
            String sectionValue = embeddingTemplateAuthor.sectionValueForEmbedding(
                    item,
                    documentSectionService.getFileNameFromUrl(item.getDocumentInstance().getRemoteUrl()),
                    agentSectionTemplate.getText()
            );

            logger.trace("Section value with template for embedding: {}", sectionValue);

            //        if(value.sha exists in eg && embedding_cache == enabled ){
//            return eg.embedding;
//        } else {
//
//        }
            EmbeddingGroup embeddingGroup = embeddingService.findBySectionOrMessage(item.getId(), null, projectAgent.getSemanticSearchModel().getId());

            String sectionSha256Hash = cryptographyUtils.calculateSHA256(sectionValue);

            if (embeddingGroup == null || !embeddingGroup.getEmbeddingSha256Hash().equals(sectionSha256Hash)) {


                embeddingResponse = embeddingService.getEmbeddingForMessage(projectAgent, sectionValue, projectAgent.getSemanticSearchModel());

            }
            else {
                // If no training needed, use the existing embedding from the embedding group
                logger.debug("Embedding found in cache for section {}. Skipping...", item.getId());
                return null;
            }
        } catch (Exception e) {
            logger.warn("Error {} getting Embedding for section {}. Skipping...", e.getMessage(), item.getId());
            return null;
        }
        logger.debug("Section processed with cost: {} tokens", embeddingResponse.getUsage().getTotalTokens());
        return new SectionEmbeddingDTO(item, embeddingResponse);
    }


}

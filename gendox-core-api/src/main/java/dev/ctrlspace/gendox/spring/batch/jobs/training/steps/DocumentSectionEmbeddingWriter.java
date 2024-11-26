package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@StepScope
public class DocumentSectionEmbeddingWriter implements ItemWriter<SectionEmbeddingDTO> {

    Logger logger = LoggerFactory.getLogger(DocumentSectionEmbeddingWriter.class);


    private OpenAiEmbeddingConverter openAiEmbeddingConverter;
    private EmbeddingService embeddingService;
    private TypeService typeService;
    private ProjectDocumentRepository projectDocumentRepository;
    private Tracer tracer;
    private CryptographyUtils cryptographyUtils;

    @Autowired
    public DocumentSectionEmbeddingWriter(OpenAiEmbeddingConverter openAiEmbeddingConverter,
                                          TypeService typeService,
                                          ProjectDocumentRepository projectDocumentRepository,
                                          EmbeddingService embeddingService,
                                          Tracer tracer,
                                          CryptographyUtils cryptographyUtils) {
        this.openAiEmbeddingConverter = openAiEmbeddingConverter;
        this.typeService = typeService;
        this.embeddingService = embeddingService;
        this.projectDocumentRepository = projectDocumentRepository;
        this.tracer = tracer;
        this.cryptographyUtils = cryptographyUtils;
    }

    @Override
    public void write(Chunk<? extends SectionEmbeddingDTO> sectionEmbeddingChunk) throws Exception {


            // Collect all document IDs and section IDs
            Set<UUID> documentIds = new HashSet<>();
            Set<UUID> sectionIds = new HashSet<>();

            for (SectionEmbeddingDTO sectionEmbeddingDTO : sectionEmbeddingChunk.getItems()) {
                DocumentInstanceSection section = sectionEmbeddingDTO.section();
                documentIds.add(section.getDocumentInstance().getId());
                sectionIds.add(section.getId());
            }

            // Fetch existing projects outside of the loop
            List<ProjectDocument> projectDocuments = projectDocumentRepository.findByDocumentIdIn(documentIds);
            Map<UUID, Project> documentIdToProject = new HashMap<>();
            for (ProjectDocument pd : projectDocuments) {
                documentIdToProject.put(pd.getDocumentId(), pd.getProject());
            }

            for (SectionEmbeddingDTO sectionEmbeddingDTO : sectionEmbeddingChunk.getItems()) {

                // TODO - refactor this to select the existing embeddings outside of the loop
                // TODO - in the loop to update/create the Entities and the store them in the DB after the loop

                DocumentInstanceSection section = sectionEmbeddingDTO.section();
                EmbeddingResponse embeddingResponse = sectionEmbeddingDTO.embeddingResponse();
                UUID documentId = section.getDocumentInstance().getId();
                // get project from map to not have multiple queries
                Project project = documentIdToProject.get(documentId);
                UUID organizationId = project.getOrganizationId();
                UUID semanticSearchModelId = project.getProjectAgent().getSemanticSearchModel().getId();
                UUID sectionId = section.getId();
                UUID messageId = null;

//                String sectionSha256Hash = cryptographyUtils.calculateSHA256(section.getSectionValue());


                embeddingService.upsertEmbeddingForText(embeddingResponse, project.getId(), null, sectionId, semanticSearchModelId, organizationId,sectionEmbeddingDTO.sectionSha256Hash());


            }

            logger.debug("Finished writing embeddings chunk");

//        } finally {
//            span.end();
//        }
    }
}

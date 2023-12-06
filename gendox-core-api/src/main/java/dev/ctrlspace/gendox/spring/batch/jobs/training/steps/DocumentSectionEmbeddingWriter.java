package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiAda2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class DocumentSectionEmbeddingWriter implements ItemWriter<SectionEmbeddingDTO> {

    Logger logger = LoggerFactory.getLogger(DocumentSectionEmbeddingWriter.class);


    private OpenAiEmbeddingConverter openAiEmbeddingConverter;
    private EmbeddingService embeddingService;
    private TypeService typeService;
    private ProjectDocumentRepository projectDocumentRepository;

    @Autowired
    public DocumentSectionEmbeddingWriter(OpenAiEmbeddingConverter openAiEmbeddingConverter,
                                          TypeService typeService,
                                          ProjectDocumentRepository projectDocumentRepository,
                                          EmbeddingService embeddingService) {
        this.openAiEmbeddingConverter = openAiEmbeddingConverter;
        this.typeService = typeService;
        this.embeddingService = embeddingService;
        this.projectDocumentRepository = projectDocumentRepository;
    }
    @Override
    public void write(Chunk<? extends SectionEmbeddingDTO> sectionEmbedingChunk) throws Exception {

        logger.debug("Start writing embeddings chunk");


        for (SectionEmbeddingDTO sectionEmbeddingDTO : sectionEmbedingChunk.getItems()) {

            // TODO - refactor this to select the existing projects and the existing embeddings outside of the loop
            // TODO - in the loop to update/create the Entities and the store them in the DB after the loop

            DocumentInstanceSection section = sectionEmbeddingDTO.section();
            EmbeddingResponse embeddingResponse = sectionEmbeddingDTO.embeddingResponse();
            List<ProjectDocument> projectDocuments = projectDocumentRepository.findByDocumentId(section.getDocumentInstance().getId());
            //get first, actually there should be exactly one project per document
            UUID projectId = projectDocuments.get(0).getProject().getId();

            embeddingService.upsertEmbeddingForText(embeddingResponse, projectId, null, section.getId());

//            throw new RuntimeException("Not implemented yet");

        }

        logger.debug("Finished writing embeddings chunk");

    }
}

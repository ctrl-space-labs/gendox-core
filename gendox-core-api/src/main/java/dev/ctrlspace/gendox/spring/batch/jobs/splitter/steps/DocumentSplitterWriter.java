package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@StepScope
public class DocumentSplitterWriter implements ItemWriter<DocumentSectionDTO> {

    private DocumentSectionService documentSectionService;

    @Autowired
    public DocumentSplitterWriter(DocumentSectionService documentSectionService) {
        this.documentSectionService = documentSectionService;
    }


    Logger logger = LoggerFactory.getLogger(DocumentSplitterWriter.class);

    @Override
    public void write(Chunk<? extends DocumentSectionDTO> chunk) throws Exception {

        logger.debug("Start writing sections chunk");

        for (DocumentSectionDTO documentSectionDTO : chunk.getItems()) {
            logger.debug("Create Sections for document instance: {}", documentSectionDTO.documentInstance().getId());
                List<DocumentInstanceSection> documentSections =
                        documentSectionService.createSections(documentSectionDTO.documentInstance(), documentSectionDTO.contentSections());

        }
    }
}

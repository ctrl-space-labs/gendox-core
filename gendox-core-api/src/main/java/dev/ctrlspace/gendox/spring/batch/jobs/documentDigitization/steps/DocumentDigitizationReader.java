package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.spring.batch.jobs.common.GendoxJpaPageReader;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class DocumentDigitizationReader extends GendoxJpaPageReader<TaskDocumentMetadataDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentDigitizationReader.class);
    private final TaskNodeService taskNodeService;
    private TaskNodeCriteria criteria;

    @Value("${gendox.batch-jobs.document-digitization.job.steps.document-digitization-step.doc-page-chunk-size}")
    private int docPageChunkSize;

    @Autowired
    public DocumentDigitizationReader(TaskNodeService taskNodeService) {
        this.taskNodeService = taskNodeService;
    }


    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        String taskId = jobParameters.getString(JobExecutionParamConstants.TASK_ID);
        assert taskId != null;
        criteria = new TaskNodeCriteria();
        criteria.setTaskId(UUID.fromString(taskId));

        ObjectMapper mapper = new ObjectMapper();

        // Deserialize documentNodeIds list from JSON string
        String documentNodeIdsJson = jobParameters.getString(JobExecutionParamConstants.DOCUMENT_NODE_IDS);
        if (documentNodeIdsJson != null && !documentNodeIdsJson.isBlank()) {
            try {
                List<UUID>  documentNodeIds = mapper.readValue(
                        documentNodeIdsJson,
                        new TypeReference<List<UUID>>() {
                        }
                );
//                criteria.setDocumentNodeIds(documentNodeIds);
                criteria.setNodeIds(documentNodeIds);
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize documentNodeIds JSON", e);
            }
        } else {
            logger.warn("No documentNodeIds provided in job parameters");
        }


        return null;
    }

    @Override
    protected Page<TaskDocumentMetadataDTO> getPageFromRepository(Pageable pageable) throws GendoxException {
        Page<TaskDocumentMetadataDTO> documentsPage = taskNodeService.getTaskDocumentMetadataByCriteria(
                criteria,
                pageable
        );

        // split document metadata to smaller parts, to process pages in chunks, instead of whole documents at once
        List<TaskDocumentMetadataDTO> documentPageChunks = splitDocumentsToMultiplePageChunks(documentsPage);

        Page<TaskDocumentMetadataDTO> chunkedDocumentPages = new org.springframework.data.domain.PageImpl<>(
                documentPageChunks,
                documentsPage.getPageable(),
                documentsPage.getTotalElements()
        );

        return chunkedDocumentPages;
    }

    private @NotNull List<TaskDocumentMetadataDTO> splitDocumentsToMultiplePageChunks(Page<TaskDocumentMetadataDTO> documentsPage) {
        List<TaskDocumentMetadataDTO> documentPageChunks = new ArrayList<>();
        // for each document, create smaller chunks
        for (TaskDocumentMetadataDTO dto : documentsPage.getContent()) {
            int totalDocumentPages = dto.getDocumentInstance().getNumberOfPages();
            // page numbering starts from 1
            int pageStartIndex = 1;
            int pageEndIndex = totalDocumentPages;
            if (dto.getPageFrom() != null) {
                pageStartIndex = dto.getPageFrom();
            }
            if (dto.getPageTo() != null) {
                pageEndIndex = dto.getPageTo();
            }
            for (int i = pageStartIndex; i <= pageEndIndex; i += docPageChunkSize) {
                TaskDocumentMetadataDTO chunkDto = dto.toBuilder().build();
                chunkDto.setPageFrom(i);
                int chunkEnd = Math.min(i + docPageChunkSize-1, pageEndIndex);
                chunkDto.setPageTo(chunkEnd);
                documentPageChunks.add(chunkDto);
            }

        }
        return documentPageChunks;
    }

    @Override
    @Value("${gendox.batch-jobs.document-digitization.job.steps.document-digitization-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

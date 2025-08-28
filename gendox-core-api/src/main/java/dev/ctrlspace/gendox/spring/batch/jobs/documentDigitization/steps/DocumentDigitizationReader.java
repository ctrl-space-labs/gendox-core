package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.spring.batch.jobs.common.GendoxJpaPageReader;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
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
import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class DocumentDigitizationReader extends GendoxJpaPageReader<TaskDocumentMetadataDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentDigitizationReader.class);
    private final TaskNodeService taskNodeService;
    private TaskNodeCriteria criteria;

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
        return documentsPage;
    }

    @Override
    @Value("${gendox.batch-jobs.document-digitization.job.steps.document-digitization-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentQuestionPairDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
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
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class DocumentInsightsReader extends GendoxJpaPageReader<TaskDocumentQuestionPairDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsReader.class);
    private final TaskService taskService;
    private TaskNodeCriteria criteria;

    @Autowired
    public DocumentInsightsReader(TaskService taskService
    ) {
        this.taskService = taskService;
    }




    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        String taskId = jobParameters.getString(JobExecutionParamConstants.TASK_ID);
        assert taskId != null;
        criteria = new TaskNodeCriteria();
        criteria.setTaskId(UUID.fromString(taskId));

        ObjectMapper mapper = new ObjectMapper();

        // Deserialize documentNodeIds list from JSON string
        String documentNodeIdsJson = jobParameters.getString("documentNodeIds");
        if (documentNodeIdsJson != null && !documentNodeIdsJson.isBlank()) {
            try {
                List<UUID> documentNodeIds = mapper.readValue(
                        documentNodeIdsJson,
                        new TypeReference<List<UUID>>() {}
                );
                criteria.setDocumentNodeIds(documentNodeIds);
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize documentNodeIds JSON", e);
            }
        }

        // Deserialize questionNodeIds list from JSON string
        String questionNodeIdsJson = jobParameters.getString("questionNodeIds");
        if (questionNodeIdsJson != null && !questionNodeIdsJson.isBlank()) {
            try {
                List<UUID> questionNodeIds = mapper.readValue(
                        questionNodeIdsJson,
                        new TypeReference<List<UUID>>() {}
                );
                criteria.setQuestionNodeIds(questionNodeIds);
            } catch (Exception e) {
                throw new RuntimeException("Failed to deserialize questionNodeIds JSON", e);
            }
        }

        return null;
    }


    @Override
    protected Page<TaskDocumentQuestionPairDTO> getPageFromRepository(Pageable pageable) throws GendoxException {
        logger.trace("Is virtual thread? {}", Thread.currentThread().isVirtual());
        Page<TaskDocumentQuestionPairDTO> dtosPage = taskService.getDocumentQuestionPairs(criteria.getTaskId(), pageable);
        return dtosPage;
    }

    @Override
    @Value("${gendox.batch-jobs.document-insights.job.steps.document-insights-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}


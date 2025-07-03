package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDocumentInsightsDTO;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@StepScope
public class DocumentInsightsReader extends GendoxJpaPageReader<TaskDocumentInsightsDTO> {

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

        // Deserialize documentNodeIds list from comma-separated string
        String documentNodeIdsStr = jobParameters.getString("documentNodeIds");
        if (documentNodeIdsStr != null && !documentNodeIdsStr.isBlank()) {
            List<UUID> documentNodeIds = Arrays.stream(documentNodeIdsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString)
                    .collect(Collectors.toList());
            criteria.setDocumentNodeIds(documentNodeIds);
        }

        // Deserialize questionNodeIds list from comma-separated string
        String questionNodeIdsStr = jobParameters.getString("questionNodeIds");
        if (questionNodeIdsStr != null && !questionNodeIdsStr.isBlank()) {
            List<UUID> questionNodeIds = Arrays.stream(questionNodeIdsStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString)
                    .collect(Collectors.toList());
            criteria.setQuestionNodeIds(questionNodeIds);
        }


        return null;
    }

    @Override
    protected Page<TaskDocumentInsightsDTO> getPageFromRepository(Pageable pageable) throws GendoxException {
        logger.trace("Is virtual thread? {}", Thread.currentThread().isVirtual());
        Page<TaskNode> taskNodes = taskService.getTaskNodesByCriteria(criteria, pageable);
        TaskDocumentInsightsDTO taskDocumentInsightsDTO = taskService.getTaskDocumentInsights(taskNodes, criteria.getTaskId());
        return new PageImpl<>(
                List.of(taskDocumentInsightsDTO),
                pageable,
                1  // total elements = 1 because it's an aggregated result, not item-by-item
        );
    }

    @Override
    @Value("${gendox.batch-jobs.document-insights.job.steps.document-insights-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}


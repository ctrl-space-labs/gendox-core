package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentQuestionsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@StepScope
public class InsightsSummaryReader extends GendoxJpaPageReader<TaskDocumentQuestionsDTO> {

    private static final Logger logger = LoggerFactory.getLogger(InsightsSummaryReader.class);
    private TaskNodeCriteria criteria;
    private final TaskNodeService taskNodeService;
    private final TaskService taskService;
    private final InsightsUtils insightsUtils;
    private boolean summarizationEnabled;

    @Autowired
    public InsightsSummaryReader(TaskNodeService taskNodeService,
                                 TaskService taskService,
                                 InsightsUtils insightsUtils) {
        this.taskNodeService = taskNodeService;
        this.taskService = taskService;
        this.insightsUtils = insightsUtils;
    }


    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        String taskId = jobParameters.getString(JobExecutionParamConstants.TASK_ID);
        assert taskId != null;
        Task task = taskService.getTaskById(UUID.fromString(taskId));
        summarizationEnabled = Boolean.TRUE.equals(task.getSummarizationEnabled());
        if (!summarizationEnabled) {
            logger.info("Skipping document insights summarization for taskId: {}", taskId);
            return null;
        }

        criteria = insightsUtils.fromJobParamsToTaskNodeCriteria(jobParameters, taskId);
        criteria.setQuestionNodeIds(List.of()); // Set empty list to fetch all questions

        logger.debug("DocumentInsightsReader initialized with criteria: {}", criteria);

        return null;
    }


    @Override
    protected Page<TaskDocumentQuestionsDTO> getPageFromRepository(Pageable pageable) throws GendoxException {
        if (!summarizationEnabled) {
            return Page.empty(pageable);
        }
        return taskNodeService.getDocumentsGroupedWithQuestions(criteria, pageable);
    }

    @Override
    @Value("${gendox.batch-jobs.document-insights.job.steps.document-insights-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

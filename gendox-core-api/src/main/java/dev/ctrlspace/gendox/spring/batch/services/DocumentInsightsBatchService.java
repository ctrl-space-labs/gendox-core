package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;


import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentInsightsBatchService {
    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsBatchService.class);

    @Value("${gendox.batch-jobs.document-insights.job.name}")
    private String documentInsightsJobName;

    private final Job documentInsightsJob;
    private final JobLauncher jobLauncher;

    @Autowired
    public DocumentInsightsBatchService(
            Job documentInsightsJob,
            JobLauncher jobLauncher) {
        this.documentInsightsJob = documentInsightsJob;
        this.jobLauncher = jobLauncher;
    }

    /**
     * Run Document Insights batch job for a specific Task ID
     */
    public JobExecution runDocumentInsights(Task task, TaskNodeCriteria criteria) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();


        ObjectMapper mapper = new ObjectMapper();

        if (criteria.getDocumentNodeIds() != null && !criteria.getDocumentNodeIds().isEmpty()) {
            try {
                String documentNodeIdsJson = mapper.writeValueAsString(criteria.getDocumentNodeIds());
                paramsBuilder.addString("documentNodeIds", documentNodeIdsJson);
            } catch (Exception e) {
                throw new GendoxException("FAILED_TO_SERIALIZE_DOCUMENT_NODE","Failed to serialize documentNodeIds to JSON", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        if (criteria.getQuestionNodeIds() != null && !criteria.getQuestionNodeIds().isEmpty()) {
            try {
                String questionNodeIdsJson = mapper.writeValueAsString(criteria.getQuestionNodeIds());
                paramsBuilder.addString("questionNodeIds", questionNodeIdsJson);
            } catch (Exception e) {
                throw new GendoxException("FAILED_TO_SERIALIZE_QUESTION_NODE", "Failed to serialize questionNodeIds to JSON", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }



        paramsBuilder.addString(JobExecutionParamConstants.TASK_ID, task.getId().toString());
        paramsBuilder.addString(JobExecutionParamConstants.NOW, Instant.now().toString());
        paramsBuilder.addString(JobExecutionParamConstants.PROJECT_ID, task.getProjectId().toString());
        paramsBuilder.addString(JobExecutionParamConstants.RE_GENERATE_EXISTING_ANSWERS, criteria.getReGenerateExistingAnswers() != null ? criteria.getReGenerateExistingAnswers().toString() : "false");
        paramsBuilder.addString(JobExecutionParamConstants.JOB_NAME, documentInsightsJobName);

        JobParameters jobParameters = paramsBuilder.toJobParameters();


        logger.info("Starting Document Insights job for Task ID {} with parameters: {}", task.getId(), jobParameters);

        // Launch the job
        JobExecution jobExecution = jobLauncher.run(documentInsightsJob, jobParameters);

        logger.info("Document Insights job started with status: {}", jobExecution.getStatus());

        return jobExecution;
    }
}

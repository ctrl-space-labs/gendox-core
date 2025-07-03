package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    public JobExecution runDocumentInsights(UUID taskId, TaskNodeCriteria criteria) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();

        paramsBuilder.addString("taskId", taskId.toString());


        // Serialize List<UUID> as comma-separated strings
        if (criteria.getDocumentNodeIds() != null && !criteria.getDocumentNodeIds().isEmpty()) {
            String documentNodeIds = criteria.getDocumentNodeIds().stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
            paramsBuilder.addString("documentNodeIds", documentNodeIds);
        }

        if (criteria.getQuestionNodeIds() != null && !criteria.getQuestionNodeIds().isEmpty()) {
            String questionNodeIds = criteria.getQuestionNodeIds().stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
            paramsBuilder.addString("questionNodeIds", questionNodeIds);
        }

        // Add a run.id param to force job rerun if needed
        paramsBuilder.addLong("run.id", System.currentTimeMillis());

        // Add jobName param for logging/debug
        paramsBuilder.addString("jobName", documentInsightsJobName);

        JobParameters jobParameters = paramsBuilder.toJobParameters();


        logger.info("Starting Document Insights job for Task ID {} with parameters: {}", taskId, jobParameters);

        // Launch the job
        JobExecution jobExecution = jobLauncher.run(documentInsightsJob, jobParameters);

        logger.info("Document Insights job started with status: {}", jobExecution.getStatus());

        return jobExecution;
    }
}

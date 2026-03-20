package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.DeepThinkingJobConfig;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class DeepThinkingBatchService {

    private static final Logger logger = LoggerFactory.getLogger(DeepThinkingBatchService.class);

    private final Job deepThinkingJob;
    private final JobLauncher jobLauncher;

    public DeepThinkingBatchService(Job deepThinkingJob, JobLauncher jobLauncher) {
        this.deepThinkingJob = deepThinkingJob;
        this.jobLauncher = jobLauncher;
    }

    public JobExecution runDeepThinking(UUID messageId, UUID projectId, UUID threadId)
            throws JobExecutionAlreadyRunningException, JobRestartException,
            JobInstanceAlreadyCompleteException, JobParametersInvalidException {

        JobParameters params = new JobParametersBuilder()
                .addString(JobExecutionParamConstants.MESSAGE_ID, messageId.toString())
                .addString(JobExecutionParamConstants.PROJECT_ID, projectId.toString())
                .addString(JobExecutionParamConstants.THREAD_ID, threadId.toString())
                .addString(JobExecutionParamConstants.JOB_NAME, DeepThinkingJobConfig.JOB_NAME)
                .addString(JobExecutionParamConstants.NOW, Instant.now().toString())
                .toJobParameters();

        logger.info("Starting deep thinking job for message {} in project {}", messageId, projectId);

        JobExecution jobExecution = jobLauncher.run(deepThinkingJob, params);

        logger.info("Deep thinking job started with execution id {} and status {}",
                jobExecution.getId(), jobExecution.getStatus());

        return jobExecution;
    }
}

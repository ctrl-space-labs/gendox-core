package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.DeepThinkingJobConfig;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.job.*;
import org.springframework.batch.core.job.parameters.*;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.launch.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.launch.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.launch.JobRestartException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class DeepThinkingBatchService {

    private static final Logger logger = LoggerFactory.getLogger(DeepThinkingBatchService.class);

    private final Job deepThinkingJob;
    private final JobOperator jobOperator;

    public DeepThinkingBatchService(Job deepThinkingJob, JobOperator jobOperator) {
        this.deepThinkingJob = deepThinkingJob;
        this.jobOperator = jobOperator;
    }

    public JobExecution runDeepThinking(UUID messageId, UUID projectId, UUID threadId)
            throws JobExecutionAlreadyRunningException, JobRestartException,
            JobInstanceAlreadyCompleteException, InvalidJobParametersException {

        JobParameters params = new JobParametersBuilder()
                .addString(JobExecutionParamConstants.MESSAGE_ID, messageId.toString())
                .addString(JobExecutionParamConstants.PROJECT_ID, projectId.toString())
                .addString(JobExecutionParamConstants.THREAD_ID, threadId.toString())
                .addString(JobExecutionParamConstants.JOB_NAME, DeepThinkingJobConfig.JOB_NAME)
                .addString(JobExecutionParamConstants.NOW, Instant.now().toString())
                .toJobParameters();

        logger.info("Starting deep thinking job for message {} in project {}", messageId, projectId);

        JobExecution jobExecution = jobOperator.start(deepThinkingJob, params);

        logger.info("Deep thinking job started with execution id {} and status {}",
                jobExecution.getId(), jobExecution.getStatus());

        return jobExecution;
    }
}

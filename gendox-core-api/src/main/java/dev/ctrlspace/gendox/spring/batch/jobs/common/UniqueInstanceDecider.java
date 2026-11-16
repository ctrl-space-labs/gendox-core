package dev.ctrlspace.gendox.spring.batch.jobs.common;

import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.parameters.JobParameters;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.step.StepExecution;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.job.flow.FlowExecutionStatus;
import org.springframework.batch.core.job.flow.JobExecutionDecider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * One run of a job per project at a time. A run that starts while an earlier one is going ends as DUPLICATE_EXECUTION;
 * of runs started at the same moment, the earliest goes ahead.
 * <p>
 * A run left STARTED by a server that stopped (deploy, crash) is not going: Spring Batch writes a step's progress after
 * every chunk, so a run whose last write is older than {@code gendox.batch-jobs.abandoned-after} is marked FAILED
 * ({@link JobOperator#recover}) and no longer blocks its project. The limit must be longer than the slowest single chunk.
 */
@Component
public class UniqueInstanceDecider implements JobExecutionDecider {

    Logger logger = LoggerFactory.getLogger(getClass());

    private final JobRepository jobRepository;

    private BatchJobExecutionRepository batchJobExecutionRepository;

    private final JobOperator jobOperator;

    private final Duration abandonedAfter;

    @Autowired
    public UniqueInstanceDecider(JobRepository jobRepository,
                                 BatchJobExecutionRepository batchJobExecutionRepository,
                                 // lazy: the operator knows the jobs, and the jobs use this decider
                                 @Lazy JobOperator jobOperator,
                                 @Value("${gendox.batch-jobs.abandoned-after:PT1H}") Duration abandonedAfter) {
        this.jobRepository = jobRepository;
        this.batchJobExecutionRepository = batchJobExecutionRepository;
        this.jobOperator = jobOperator;
        this.abandonedAfter = abandonedAfter;
    }

    @Override
    public FlowExecutionStatus decide(JobExecution jobExecution, StepExecution stepExecution) {
        JobParameters parameters = jobExecution.getJobParameters();
        List<BatchJobExecution> batchJobExecutions;
        // if projectId exists in parameters, filter by projectId
        if (parameters.getString(JobExecutionParamConstants.PROJECT_ID) != null) {
            batchJobExecutions = batchJobExecutionRepository.findJobExecutionByJobNameAndStatusAndProjectParam(jobExecution.getJobInstance().getJobName(),
                    "STARTED",
                    parameters.getString(JobExecutionParamConstants.PROJECT_ID));

        } else { // if no projectId, just filter by job name and status
            batchJobExecutions = batchJobExecutionRepository.findJobExecutionByJobNameAndStatus(jobExecution.getJobInstance().getJobName(), "STARTED");
        }

        // only a run started before this one counts: a later one sees this run and skips itself
        for (BatchJobExecution other : batchJobExecutions) {
            if (other.getJobExecutionId() >= jobExecution.getId()) {
                continue;
            }
            if (isAbandoned(other)) {
                markFailed(other);
                continue;
            }
            logger.info("Job {} already running, skipping this execution", jobExecution.getJobInstance().getJobName());
            return new FlowExecutionStatus("DUPLICATE_EXECUTION");
        }

        return new FlowExecutionStatus("CONTINUE");
    }

    /** Its steps wrote no progress for longer than abandonedAfter (they write after every chunk). */
    private boolean isAbandoned(BatchJobExecution execution) {
        Timestamp lastStepUpdate = batchJobExecutionRepository.findLastStepUpdate(execution.getJobExecutionId());
        Instant lastProgress = lastStepUpdate != null ? lastStepUpdate.toInstant() : execution.getCreateTime();
        return lastProgress.isBefore(Instant.now().minus(abandonedAfter));
    }

    private void markFailed(BatchJobExecution abandoned) {
        logger.warn("Job execution {} has written no progress for over {}; marking it FAILED", abandoned.getJobExecutionId(), abandonedAfter);
        try {
            JobExecution execution = jobRepository.getJobExecution(abandoned.getJobExecutionId());
            if (execution != null) {
                jobOperator.recover(execution);
            }
        } catch (Exception e) {
            // another run may be recovering it at the same moment; it no longer blocks this one either way
            logger.warn("Could not mark job execution {} FAILED: {}", abandoned.getJobExecutionId(), e.getMessage());
        }
    }
}

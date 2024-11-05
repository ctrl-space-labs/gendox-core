package dev.ctrlspace.gendox.spring.batch.jobs.common;

import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.batch.core.job.flow.FlowExecutionStatus;
import org.springframework.batch.core.job.flow.JobExecutionDecider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UniqueInstanceDecider implements JobExecutionDecider {

    Logger logger = LoggerFactory.getLogger(getClass());

    private final JobExplorer jobExplorer;

    private BatchJobExecutionRepository batchJobExecutionRepository;

    @Autowired
    public UniqueInstanceDecider(JobExplorer jobExplorer,
                                 BatchJobExecutionRepository batchJobExecutionRepository) {
        this.jobExplorer = jobExplorer;
        this.batchJobExecutionRepository = batchJobExecutionRepository;
    }

    @Override
    public FlowExecutionStatus decide(JobExecution jobExecution, StepExecution stepExecution) {
        JobParameters parameters = jobExecution.getJobParameters();
        List<BatchJobExecution> batchJobExecutions = batchJobExecutionRepository.findJobExecutionByJobNameAndStatus(jobExecution.getJobInstance().getJobName(), "STARTED");

        // only this job with same name is running
        if (batchJobExecutions.size() == 1 && batchJobExecutions.get(0).getJobExecutionId().equals(jobExecution.getId())) {
            return new FlowExecutionStatus("CONTINUE");
        }

        logger.info("Job {} already running, skipping this execution", jobExecution.getJobInstance().getJobName());

        return new FlowExecutionStatus("DUPLICATE_EXECUTION");
    }
}

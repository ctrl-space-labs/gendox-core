package dev.ctrlspace.gendox.spring.batch.utils;

import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecutionParams;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionParamCriteria;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionParamsRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.specifications.BatchExecutionPredicates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Component
public class JobUtils {

    Logger logger = LoggerFactory.getLogger(JobUtils.class);

    @Value("${gendox.batch-jobs.default-start-days:365}")
    private long defaultStartDays;

    private BatchJobExecutionRepository batchJobExecutionRepository;
    private BatchJobExecutionParamsRepository batchJobExecutionParamsRepository;

    @Autowired
    public JobUtils(BatchJobExecutionRepository batchJobExecutionRepository,
                    BatchJobExecutionParamsRepository batchJobExecutionParamsRepository) {
        this.batchJobExecutionRepository = batchJobExecutionRepository;
        this.batchJobExecutionParamsRepository = batchJobExecutionParamsRepository;
    }

    /**
     * Helper method to get the last completed job's "now" parameter, or 1 year ago if not found
     */
    public Instant getLastCompletedJobTime(String jobName, Instant now, UUID projectId, boolean override) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        PageRequest pageRequest = PageRequest.of(0, 1, sort);
        BatchExecutionCriteria criteria = BatchExecutionCriteria.builder()
                .jobName(jobName)
                .status("COMPLETED")
                .exitCode("COMPLETED")
                .build();

        if (projectId != null) {
            criteria.getMatchAllParams().add(new BatchExecutionParamCriteria(JobExecutionParamConstants.PROJECT_ID, projectId.toString()));
        } else {
            criteria.getMatchAllParams().add(new BatchExecutionParamCriteria(JobExecutionParamConstants.PROJECT_ID, JobExecutionParamConstants.ALL_PROJECTS));
        }

        // TODO: probably this if is not needed. The `overrideDefaultPeriod` parameter is used to determine
        //  if the job should run with the default period (from the previous successful run) or not.
        //  But this method should return the last completed job time according to the criteria,
        //  if the `overrideDefaultPeriod` is true or null, it should return the last completed job, matching the criteria.
        if (!override) {
            criteria.getMatchAllParams().add(new BatchExecutionParamCriteria(JobExecutionParamConstants.OVERRIDE_DEFAULT_PERIOD, "false"));
        }

        Page<BatchJobExecution> batchJobExecutions =
                batchJobExecutionRepository.findAll(BatchExecutionPredicates.build(criteria), pageRequest);


        Instant start;
        if (batchJobExecutions.getContent().isEmpty()) {
            start = now.minus(defaultStartDays, ChronoUnit.DAYS);
        } else {
            BatchJobExecutionParams previousJobExecutionNowParam = batchJobExecutionParamsRepository
                    .findByExecutionIdAndName(batchJobExecutions.getContent().get(0).getJobExecutionId(), "now");
            start = Instant.parse(previousJobExecutionNowParam.getParameterValue());

        }


        return start;
    }

    public Page<BatchJobExecution> getJobsByCriteria(BatchExecutionCriteria criteria, Pageable pageable) {


        Page<BatchJobExecution> batchJobExecutions =
                batchJobExecutionRepository.findAll(BatchExecutionPredicates.build(criteria), pageable);

        return batchJobExecutions;

    }



    public JobParameters buildJobParameters(
            JobParameters baseParams,
            Instant now,
            boolean override,
            String jobName,
            Map<String, String> additionalParams) {

        JobParametersBuilder builder = new JobParametersBuilder(baseParams)
                .addString(JobExecutionParamConstants.NOW, now.toString())
                .addString(JobExecutionParamConstants.OVERRIDE_DEFAULT_PERIOD, Boolean.toString(override))
                .addString(JobExecutionParamConstants.JOB_NAME, jobName);

        additionalParams.forEach(builder::addString);

        return builder.toJobParameters();
    }

    public void waitForJobCompletion(JobExecution execution) throws InterruptedException {
        int counterSeconds = 0;
        while (execution.isRunning()) {
            Thread.sleep(1000);
            counterSeconds++;
            if (counterSeconds % 600 == 0) {
                logger.info("Job execution ({}, {}) is still running after {} seconds",
                        execution.getId(), execution.getJobInstance().getJobName(), counterSeconds);
            } else if (counterSeconds % 60 == 0) {
                logger.debug("Job execution ({}, {}) is still running after {} seconds",
                        execution.getId(), execution.getJobInstance().getJobName(), counterSeconds);
            }

        }
    }

    public void checkJobFailure(JobExecution execution, String jobName) {
        if (execution.getStatus() != BatchStatus.COMPLETED) {
            logger.error("Job {} failed with status: {}", jobName, execution.getStatus());
            throw new IllegalStateException("Job failed: " + jobName);
        }
    }




}

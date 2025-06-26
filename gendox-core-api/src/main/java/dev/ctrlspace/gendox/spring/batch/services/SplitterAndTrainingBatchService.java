package dev.ctrlspace.gendox.spring.batch.services;

import brave.internal.Nullable;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SplitterAndTrainingBatchService {
    Logger logger = LoggerFactory.getLogger(SplitterAndTrainingBatchService.class);


    private final JobUtils jobUtils;
    private final SplitterBatchService splitterBatchService;
    private final TrainingBatchService trainingBatchService;

    @Autowired
    public SplitterAndTrainingBatchService(
            JobUtils jobUtils,
            SplitterBatchService splitterBatchService,
            TrainingBatchService trainingBatchService) {
        this.jobUtils = jobUtils;
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
    }

    public JobExecution runSplitterAndTraining() throws
            JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException,
            JobParametersInvalidException, JobRestartException, InterruptedException, GendoxException {
        return this.runSplitterAndTraining(null, null);
    }

    public JobExecution runSplitterAndTraining(@Nullable UUID projectId) throws
            JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException,
            JobParametersInvalidException, JobRestartException, InterruptedException, GendoxException {
        return this.runSplitterAndTraining(projectId, null);
    }


    /**
     * Run the combined Splitter & Training job for a specific project, or for all projects if projectId is null.
     * You can extend this method to include custom time ranges or other job parameters as needed.
     */
    public JobExecution runSplitterAndTraining(@Nullable UUID projectId, @Nullable TimePeriodDTO timePeriod) throws
            JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException,
            JobParametersInvalidException, JobRestartException, InterruptedException, GendoxException {

        logger.info("Running Splitter and Training job for projectId: {}", projectId);

        // Run the splitter job using SplitterBatchService
        logger.info("Starting splitter job...");
        JobExecution splitterExecution = splitterBatchService.runAutoSplitter(projectId, timePeriod);
        jobUtils.waitForJobCompletion(splitterExecution);

        logger.info("Splitter job completed successfully with status: {}", splitterExecution.getStatus());

        // Run training job using TrainingBatchService
        logger.info("Starting training job...");
        JobExecution trainingExecution = trainingBatchService.runAutoTraining(projectId, timePeriod);
        jobUtils.waitForJobCompletion(trainingExecution);
        logger.info("Training job completed successfully with status: {}", trainingExecution.getStatus());

        return trainingExecution;

    }


}

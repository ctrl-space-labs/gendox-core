package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AsyncExecutionTypes;
import dev.ctrlspace.gendox.spring.batch.services.SplitterAndTrainingBatchService;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.batch.core.JobExecution;

import java.util.UUID;


@Service
public class AsyncService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(this.getClass());

    private SplitterBatchService splitterBatchService;
    private TrainingBatchService trainingBatchService;
    private SplitterAndTrainingBatchService splitterAndTrainingBatchService;

    @Autowired
    public AsyncService(SplitterBatchService splitterBatchService,
                        TrainingBatchService trainingBatchService,
                        SplitterAndTrainingBatchService splitterAndTrainingBatchService) {
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.splitterAndTrainingBatchService = splitterAndTrainingBatchService;
    }

    @Async
    public void executeSplitterAndTraining(UUID projectId, String executionType) throws GendoxException {

        logger.info("Process started: Type = {}, Project ID = {}", executionType, projectId);
        if (executionType == null || executionType.isEmpty()) {
            throw new GendoxException("EXECUTION_TYPE_NOT_FOUND", "Execution type cannot be null or empty", HttpStatus.NOT_FOUND);
        }

        if (executionType.equals(AsyncExecutionTypes.SPLITTER_AND_TRAINING)) {
            // Execute Splitter and Training
            try {
                JobExecution jobExecution = splitterAndTrainingBatchService.runSplitterAndTraining(projectId);
                logger.info("Splitter and Training Job Execution Status: {}", jobExecution.getStatus());
            } catch (Exception e) {
                logger.error("Error during Splitter and Training Job: {}", e.getMessage());
            }
        }

        if (executionType.equals(AsyncExecutionTypes.SPLITTER)) {
            // Execute Splitter
            try {
                JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter(projectId);
                logger.info("Splitter Job Execution Status: {}", splitterJobExecution.getStatus());
            } catch (Exception e) {
                logger.error("Error during Splitter Job: {}", e.getMessage());
            }
        }

        if (executionType.equals(AsyncExecutionTypes.TRAINING)) {
            // Execute Training
            try {
                JobExecution trainingJobExecution = trainingBatchService.runAutoTraining(projectId);
                logger.info("Training Job Execution Status: {}", trainingJobExecution.getStatus());
            } catch (Exception e) {
                logger.error("Error during Training Job: {}", e.getMessage());
            }
        }

        // Simulate a long process or include additional logic as needed
        try {
            Thread.sleep(10000); // 10 seconds, adjust according to your actual long-running task
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        logger.info("Process finished");
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.spring.batch.services.*;
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
    private DocumentInsightsBatchService documentInsightsBatchService;

    @Autowired
    public AsyncService(SplitterBatchService splitterBatchService,
                        TrainingBatchService trainingBatchService,
                        SplitterAndTrainingBatchService splitterAndTrainingBatchService,
                        DocumentInsightsBatchService documentInsightsBatchService) {
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.splitterAndTrainingBatchService = splitterAndTrainingBatchService;
        this.documentInsightsBatchService = documentInsightsBatchService;
    }

    @Async
    public void executeSplitter(UUID projectId, TimePeriodDTO timePeriod) throws GendoxException {
        logger.info("Process Splitter started for Project ID = {}", projectId);
        try {
            JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter(projectId, timePeriod);
            logger.info("Splitter Job Execution Status: {}", splitterJobExecution.getStatus());
        } catch (Exception e) {
            throw new GendoxException("SPLITTER_JOB_FAILED", "Error during splitter job execution: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        logger.info("Process Splitter finished");
    }

    @Async
    public void executeTraining(UUID projectId, TimePeriodDTO timePeriod) throws GendoxException {
        logger.info("Process Training started for Project ID = {}", projectId);
        try {
            JobExecution trainingJobExecution = trainingBatchService.runAutoTraining(projectId, timePeriod);
            logger.info("Training Job Execution Status: {}", trainingJobExecution.getStatus());
        } catch (Exception e) {
            throw new GendoxException("TRAINING_JOB_FAILED", "Error during training job execution: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        logger.info("Process Training finished");
    }

    @Async
    public void executeSplitterAndTraining(UUID projectId, TimePeriodDTO timePeriod) throws GendoxException {
        logger.info("Process Splitter and Training started for Project ID = {}", projectId);
        try {
            JobExecution jobExecution = splitterAndTrainingBatchService.runSplitterAndTraining(projectId, timePeriod);
            logger.info("Splitter and Training Job Execution Status: {}", jobExecution.getStatus());
        } catch (Exception e) {
            throw new GendoxException("SPLITTER_AND_TRAINING_JOB_FAILED", "Error during splitter and training job execution: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
        logger.info("Process Splitter and Training finished");
    }

    @Async
    public void executeDocumentInsightsTask(UUID taskId, TaskNodeCriteria criteria) {
        try {
            logger.info("Starting Document Insights async batch for task {}", taskId);
            JobExecution taskJobExecution = documentInsightsBatchService.runDocumentInsights(taskId, criteria);
            logger.warn("Document Insights job is not yet implemented");
            logger.info("Document Insights Job Execution Status: {}", taskJobExecution.getStatus());
        } catch (Exception e) {
            logger.error("Error executing Document Insights task {}", taskId, e);
        }
    }


}

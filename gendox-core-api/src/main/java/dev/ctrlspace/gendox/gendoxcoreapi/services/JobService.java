package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import dev.ctrlspace.gendox.spring.batch.services.*;
import org.slf4j.Logger;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.JobExecution;
import org.springframework.batch.core.explore.JobExplorer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;


@Service
public class JobService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(this.getClass());

    private SplitterBatchService splitterBatchService;
    private TrainingBatchService trainingBatchService;
    private SplitterAndTrainingBatchService splitterAndTrainingBatchService;
    private DocumentInsightsBatchService documentInsightsBatchService;
    private DocumentDigitizationBatchService documentDigitizationBatchService;
    private final JobExplorer jobExplorer;
    private final TaskService taskService;

    @Autowired
    public JobService(SplitterBatchService splitterBatchService,
                      TrainingBatchService trainingBatchService,
                      SplitterAndTrainingBatchService splitterAndTrainingBatchService,
                      DocumentInsightsBatchService documentInsightsBatchService,
                      DocumentDigitizationBatchService documentDigitizationBatchService,
                      JobExplorer jobExplorer,
                      TaskService taskService) {
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.splitterAndTrainingBatchService = splitterAndTrainingBatchService;
        this.documentInsightsBatchService = documentInsightsBatchService;
        this.documentDigitizationBatchService = documentDigitizationBatchService;
        this.jobExplorer = jobExplorer;
        this.taskService = taskService;
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
    public CompletableFuture<JobExecution> executeDocumentInsightsTask(Task task, TaskNodeCriteria criteria) {
        try {
            logger.info("Starting Document Insights async batch for task {}", task.getId());
            JobExecution jobExecution = documentInsightsBatchService.runDocumentInsights(task, criteria);
            logger.info("Document Insights Job Execution Status: {}", jobExecution.getStatus());
            return CompletableFuture.completedFuture(jobExecution);
        } catch (Exception e) {
            logger.error("Error executing Document Insights task {}", task.getId(), e);
            return CompletableFuture.completedFuture(null);
        }
    }

    @Async
    public CompletableFuture<JobExecution> executeDocumentDigitizationTask(Task task, TaskNodeCriteria criteria) {
        try {
            logger.info("Starting Document Digitization async batch for task {}", task.getId());
            JobExecution jobExecution = documentDigitizationBatchService.runDocumentDigitization(task, criteria);
            logger.info("Document Digitization Job Execution Status: {}", jobExecution.getStatus());
            return CompletableFuture.completedFuture(jobExecution);
        } catch (Exception e) {
            logger.error("Error executing Document Insights task {}", task.getId(), e);
            return CompletableFuture.completedFuture(null);
        }
    }


}

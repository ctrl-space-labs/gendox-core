package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskDTO;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TaskBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.batch.core.JobExecution;

import java.util.List;
import java.util.UUID;


@Service
public class AsyncService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(this.getClass());

    private SplitterBatchService splitterBatchService;
    private TrainingBatchService trainingBatchService;
    private TaskService taskService;
    private final TaskBatchService taskBatchService;


    @Autowired
    public AsyncService(SplitterBatchService splitterBatchService,
                        TrainingBatchService trainingBatchService,
                        TaskService taskService,
                        TaskBatchService taskBatchService) {
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.taskService = taskService;
        this.taskBatchService = taskBatchService;
    }

    @Async
    public void executeSplitterAndTraining() throws GendoxException {

        logger.info("Process started");
        // Execute Splitter
        try {
            JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter();
            logger.info("Splitter Job Execution Status: {}", splitterJobExecution.getStatus());
        } catch (Exception e) {
            logger.info("Error during Splitter Job: {}", e.getMessage());
        }

        // Execute Training
        try {
            JobExecution trainingJobExecution = trainingBatchService.runAutoTraining();
            logger.info("Training Job Execution Status: {}", trainingJobExecution.getStatus());
        } catch (Exception e) {
            logger.info("Error during Training Job: {}", e.getMessage());
        }

        // Simulate a long process or include additional logic as needed
        try {
            Thread.sleep(10000); // 10 seconds, adjust according to your actual long-running task
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        logger.info("Process finished");
    }

    @Async
    public void executeTask(UUID taskId) {
        try {
            Task task = taskService.getTaskById(taskId);
            String taskType = task.getTaskType().getName();

            logger.info("Starting async batch for task {} of type {}", taskId, taskType);
            JobExecution taskJobExecution = taskBatchService.runTaskJob(task);
            logger.info("Task Job Execution Status: {}", taskJobExecution.getStatus());
//            taskService.updateStatus(taskId, "COMPLETED");


        } catch (Exception e) {
            logger.error("Error executing task {}", taskId, e);
//            taskService.updateStatus(taskId, "FAILED");
        }
    }
}

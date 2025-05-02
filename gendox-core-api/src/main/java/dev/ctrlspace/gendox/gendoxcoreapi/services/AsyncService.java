package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import dev.ctrlspace.gendox.spring.batch.services.TrainingBatchService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.batch.core.JobExecution;


@Service
public class AsyncService {

    Logger logger = org.slf4j.LoggerFactory.getLogger(this.getClass());

    private SplitterBatchService splitterBatchService;
    private TrainingBatchService trainingBatchService;

    @Autowired
    public AsyncService(SplitterBatchService splitterBatchService,
                        TrainingBatchService trainingBatchService) {
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
    }

    @Async
    public void executeSplitterAndTraining() throws GendoxException {

        System.out.println("Process started");
        // Execute Splitter
        try {
            JobExecution splitterJobExecution = splitterBatchService.runAutoSplitter();
            System.out.println("Splitter Job Execution Status: " + splitterJobExecution.getStatus());
        } catch (Exception e) {
            System.err.println("Error during Splitter Job: " + e.getMessage());
        }

        // Execute Training
        try {
            JobExecution trainingJobExecution = trainingBatchService.runAutoTraining();
            System.out.println("Training Job Execution Status: " + trainingJobExecution.getStatus());
        } catch (Exception e) {
            System.err.println("Error during Training Job: " + e.getMessage());
        }

        // Simulate a long process or include additional logic as needed
        try {
            Thread.sleep(10000); // 10 seconds, adjust according to your actual long-running task
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        System.out.println("Process finished");
    }
}

package dev.ctrlspace.gendox.spring.batch.services;

import brave.internal.Nullable;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QueueMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SplitterAndTrainingBatchService {
    private final ObjectMapper objectMapper;
    private final ProjectService projectService;
    Logger logger = LoggerFactory.getLogger(SplitterAndTrainingBatchService.class);


    private final JobUtils jobUtils;
    private final SplitterBatchService splitterBatchService;
    private final TrainingBatchService trainingBatchService;
    private final String documentUploadTopicName;
    private final String attachmentUploadTopicName;

    @Autowired
    public SplitterAndTrainingBatchService(
            JobUtils jobUtils,
            SplitterBatchService splitterBatchService,
            TrainingBatchService trainingBatchService,
            ObjectMapper objectMapper,
            ProjectService projectService,
            @Value("${gendox.topics.document-upload}") String documentUploadTopicName,
            @Value("${gendox.topics.attachment-upload}") String attachmentUploadTopicName) {
        this.jobUtils = jobUtils;
        this.splitterBatchService = splitterBatchService;
        this.trainingBatchService = trainingBatchService;
        this.objectMapper = objectMapper;
        this.projectService = projectService;
        this.documentUploadTopicName = documentUploadTopicName;
        this.attachmentUploadTopicName = attachmentUploadTopicName;
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



    public void runSplitterAndTrainingForBatchOfFiles(List<QueueMessage> batch) {
        logger.info("Received message from topic: {}, processing {} messages", documentUploadTopicName, batch.size());

        try {

            // check if projectId is not null
            boolean hasNullProjectId = batch.stream()
                    .map(message -> {
                        try {
                            return objectMapper.treeToValue(message.getPayload(), DocumentCriteria.class);
                        } catch (JsonProcessingException e) {
                            return null;
                        }
                    })
                    .filter(Objects::nonNull)
                    .anyMatch(d -> d.getProjectId() == null);

            // if null projectId
            if (hasNullProjectId) {
                logger.info("Batch contains null projectId. Running Splitter & Training for ALL projects.");
                this.runSplitterAndTraining();
                return;
            }

            // if not null projectId, run for specific projects
            List<Project> projects = getProjectsWithNewDocuments(batch);

            for (Project project : projects) {
                if (project.getAutoTraining()) {
                    this.runSplitterAndTraining(project.getId());
                }
            }

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private @NotNull List<Project> getProjectsWithNewDocuments(List<QueueMessage> batch) throws GendoxException {
        Set<String> uniqueProjects = batch.stream().map(message -> {
                    try {
                        return objectMapper.treeToValue(message.getPayload(), DocumentCriteria.class);
                    } catch (JsonProcessingException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .map(d -> d.getProjectId())
                .collect(Collectors.toSet());


        ProjectCriteria projectCriteria = ProjectCriteria.builder()
                .projectIdIn(uniqueProjects.stream().toList())
                .build();
        List<Project> projects = projectService.getAllProjects(projectCriteria, Pageable.unpaged()).stream().toList();
        return projects;
    }


}

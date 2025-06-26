package dev.ctrlspace.gendox.spring.batch.services;

import brave.internal.Nullable;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentSectionCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import dev.ctrlspace.gendox.spring.batch.utils.TimePeriodUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class TrainingBatchService {
    Logger logger = LoggerFactory.getLogger(TrainingBatchService.class);
    @Value("${gendox.batch-jobs.document-training.job.name}")
    private String documentTrainingJobName;
    private final DocumentSectionCriteriaJobParamsConverter documentSectionCriteriaJobParamsConverter;
    private final Job documentTrainingJob;
    private final JobLauncher jobLauncher;
    private final JobUtils jobUtils;


    @Autowired
    public TrainingBatchService(
            DocumentSectionCriteriaJobParamsConverter documentSectionCriteriaJobParamsConverter,
            Job documentTrainingJob,
            JobLauncher jobLauncher,
            JobUtils jobUtils) {
        this.documentSectionCriteriaJobParamsConverter = documentSectionCriteriaJobParamsConverter;
        this.documentTrainingJob = documentTrainingJob;
        this.jobLauncher = jobLauncher;
        this.jobUtils = jobUtils;
    }

    public JobExecution runAutoTraining() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {
        return this.runAutoTraining(null);
    }
    public JobExecution runAutoTraining(@Nullable UUID projectId) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {
        return this.runAutoTraining(projectId, null);
    }

    public JobExecution runAutoTraining(@Nullable UUID projectId, @Nullable TimePeriodDTO timePeriod) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {


        var trainingTimePeriodAndOverride = TimePeriodUtils.prepareTimePeriodAndOverride(
                jobUtils, documentTrainingJobName, timePeriod, projectId);


        DocumentInstanceSectionCriteria sectionCriteria = DocumentInstanceSectionCriteria.builder()
                .updatedBetween(trainingTimePeriodAndOverride.timePeriod())
                .projectAutoTraining(true)
                .build();
        if (projectId != null) {
            sectionCriteria.setProjectId(projectId.toString());
        }

        JobParameters trainingParams = jobUtils.buildJobParameters(
                documentSectionCriteriaJobParamsConverter.toDTO(sectionCriteria),
                trainingTimePeriodAndOverride.now(),
                trainingTimePeriodAndOverride.overrideDefaultPeriod(),
                documentTrainingJobName,
                Map.of(JobExecutionParamConstants.SKIP_KNOWN_EMBEDDINGS, "true")
        );

        logger.info("Start Running document training job with parameters: {}", trainingParams);

        return jobLauncher.run(documentTrainingJob, trainingParams);

    }


}

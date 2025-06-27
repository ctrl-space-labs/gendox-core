package dev.ctrlspace.gendox.spring.batch.services;

import brave.internal.Nullable;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
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
public class SplitterBatchService {
    Logger logger = LoggerFactory.getLogger(SplitterBatchService.class);
    @Value("${gendox.batch-jobs.document-splitter.job.name}")
    private String documentSplitterJobName;

    private final DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter;
    private final Job documentSplitterJob;
    private final JobLauncher jobLauncher;
    private final JobUtils jobUtils;

    @Autowired
    public SplitterBatchService(
            DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter,
            Job documentSplitterJob,
            JobLauncher jobLauncher,
            JobUtils jobUtils) {
        this.documentInstanceCriteriaJobParamsConverter = documentInstanceCriteriaJobParamsConverter;
        this.documentSplitterJob = documentSplitterJob;
        this.jobLauncher = jobLauncher;
        this.jobUtils = jobUtils;
    }

    public JobExecution runAutoSplitter() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {
        return this.runAutoSplitter(null, null);
    }

    public JobExecution runAutoSplitter(@Nullable UUID projectId) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {
        return this.runAutoSplitter(projectId, null);
    }

    public JobExecution runAutoSplitter(@Nullable UUID projectId, @Nullable TimePeriodDTO timePeriod) throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {


        var splitterTimePeriodAndOverride = TimePeriodUtils.prepareTimePeriodAndOverride(
                jobUtils, documentSplitterJobName, timePeriod, projectId);

        DocumentCriteria documentCriteria = DocumentCriteria.builder()
                .updatedBetween(splitterTimePeriodAndOverride.timePeriod())
                .build();
        if (projectId != null) {
            documentCriteria.setProjectId(projectId.toString());
        }

        JobParameters splitterParams = jobUtils.buildJobParameters(
                documentInstanceCriteriaJobParamsConverter.toDTO(documentCriteria),
                splitterTimePeriodAndOverride.now(),
                splitterTimePeriodAndOverride.overrideDefaultPeriod(),
                documentSplitterJobName,
                Map.of(JobExecutionParamConstants.SKIP_UNCHANGED_DOCS, "true")
        );


        logger.info("Start Running document splitter job with parameters: {}", splitterParams);
        return jobLauncher.run(documentSplitterJob, splitterParams);


    }
}

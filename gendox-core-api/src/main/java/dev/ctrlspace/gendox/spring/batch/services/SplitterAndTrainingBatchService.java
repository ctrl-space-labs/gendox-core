package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentSectionCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecutionParams;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.criteria.ParamCriteria;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionParamsRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.specifications.BatchExecutionPredicates;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class SplitterAndTrainingBatchService {
    Logger logger = LoggerFactory.getLogger(SplitterAndTrainingBatchService.class);


    @Value("${gendox.batch-jobs.document-splitter.job.name}")
    private String documentSplitterJobName;
    @Value("${gendox.batch-jobs.document-training.job.name}")
    private String documentTrainingJobName;
    @Autowired
    private BatchJobExecutionRepository batchJobExecutionRepository;
    @Autowired
    private BatchJobExecutionParamsRepository batchJobExecutionParamsRepository;
    @Autowired
    private DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter;
    @Autowired
    private DocumentSectionCriteriaJobParamsConverter documentSectionCriteriaJobParamsConverter;
    @Autowired
    private Job splitterAndTrainingJob;
    @Autowired
    private JobLauncher jobLauncher;
    @Autowired
    private Job documentSplitterJob;
    @Autowired
    private Job documentTrainingJob;

    /**
     * Run the combined Splitter & Training job for a specific project, or for all projects if projectId is null.
     * You can extend this method to include custom time ranges or other job parameters as needed.
     */
    public JobExecution runSplitterAndTraining(UUID projectId) throws
            JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException,
            JobParametersInvalidException, JobRestartException, InterruptedException {


        // ----------------------------------------- Splitter Job -----------------------------------------
        Instant now = Instant.now();
        Instant splitterStart = getLastCompletedJobTime(documentSplitterJobName, now, projectId);

        DocumentCriteria documentCriteria = DocumentCriteria.builder()
                .updatedBetween(new TimePeriodDTO(splitterStart, now))
                .build();
        if (projectId != null) {
            documentCriteria.setProjectId(projectId.toString());
        }

        JobParameters splitterParams = documentInstanceCriteriaJobParamsConverter.toDTO(documentCriteria);
        splitterParams = new JobParametersBuilder(splitterParams)
                .addString("now", now.toString())
                .addString("skipUnchangedDocs", "true")
                .toJobParameters();

        logger.info("Start Running document splitter job with parameters: {}", splitterParams);
        JobExecution splitterExecution = jobLauncher.run(documentSplitterJob, splitterParams);
        while (splitterExecution.isRunning()) {
            Thread.sleep(1000); // Wait for the splitter job to complete
        }

        // Check for splitter failure
        if (splitterExecution.getStatus() != BatchStatus.COMPLETED) {
            logger.error("Splitter job failed with status: {}", splitterExecution.getStatus());
            throw new IllegalStateException("Splitter job failed! Will not run training.");
        }
        logger.info("Document splitter job completed successfully.");


        // ----------------------------------------- Training Job -----------------------------------------

        Instant trainingNow = Instant.now();
        Instant trainingStart = getLastCompletedJobTime(documentTrainingJobName, trainingNow, projectId);

        DocumentInstanceSectionCriteria sectionCriteria = DocumentInstanceSectionCriteria.builder()
                .updatedBetween(new TimePeriodDTO(trainingStart, trainingNow))
                .projectAutoTraining(true)
                .build();
        if (projectId != null) {
            sectionCriteria.setProjectId(projectId.toString());
        }

        JobParameters trainingParams = documentSectionCriteriaJobParamsConverter.toDTO(sectionCriteria);
        trainingParams = new JobParametersBuilder(trainingParams)
                .addString("now", now.toString())
                .addString("skipKnownEmbeddings", "true")
                .toJobParameters();

        logger.info("Start Running document training job with parameters: {}", trainingParams);
        JobExecution trainingExecution = jobLauncher.run(documentTrainingJob, trainingParams);
        logger.info("Document training job completed successfully.");


        return trainingExecution;

    }

    /**
     * Helper method to get the last completed job's "now" parameter, or 1 year ago if not found
     */
    private Instant getLastCompletedJobTime(String jobName, Instant defaultIfNone, UUID projectId) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        PageRequest pageRequest = PageRequest.of(0, 1, sort);
        BatchExecutionCriteria criteria = BatchExecutionCriteria.builder()
                .jobName(jobName)
                .status("COMPLETED")
                .exitCode("COMPLETED")
                .build();

        if (projectId != null) {
            criteria.getMatchAllParams().add(new ParamCriteria("projectId", projectId.toString()));
        } else {
            criteria.getMatchAllParams().add(new ParamCriteria("projectId", null));
        }

        Page<BatchJobExecution> batchJobExecutions =
                batchJobExecutionRepository.findAll(BatchExecutionPredicates.build(criteria), pageRequest);

        Instant now = Instant.now();

        Instant start;
        if (batchJobExecutions.getContent().isEmpty()) {
            start = now.minus(365, ChronoUnit.DAYS);
        } else {
            BatchJobExecutionParams previousJobExecutionNowParam = batchJobExecutionParamsRepository
                    .findByExecutionIdAndName(batchJobExecutions.getContent().get(0).getJobExecutionId(), "now");
            start = Instant.parse(previousJobExecutionNowParam.getParameterValue());

        }



        return start;
    }


}

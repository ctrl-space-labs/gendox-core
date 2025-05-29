package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentSectionCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecutionParams;
import dev.ctrlspace.gendox.spring.batch.model.criteria.BatchExecutionCriteria;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionParamsRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.repositories.specifications.BatchExecutionPredicates;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class SplitterAndTrainingBatchService {

    @Value("${gendox.batch-jobs.splitter-and-training.job.name}")
    private String splitterAndTrainingJobName;
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

    /**
     * Run the combined Splitter & Training job for a specific project, or for all projects if projectId is null.
     * You can extend this method to include custom time ranges or other job parameters as needed.
     */
    public JobExecution runSplitterAndTraining(UUID projectId) throws
            JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException,
            JobParametersInvalidException, JobRestartException {

        BatchExecutionCriteria criteria = BatchExecutionCriteria.builder()
                .jobName(splitterAndTrainingJobName)
                .status("COMPLETED")
                .exitCode("COMPLETED")
                .build();

        Sort sort = Sort.by(Sort.Direction.DESC, "createTime");
        PageRequest pageRequest = PageRequest.of(0, 1, sort);
        Instant now = Instant.now();

        //find latest completed job by name
        Page<BatchJobExecution> batchJobExecutions = batchJobExecutionRepository.findAll(BatchExecutionPredicates.build(criteria), pageRequest);

        Instant start;
        if (batchJobExecutions.getContent().isEmpty()) {
            start = now.minus(365, ChronoUnit.DAYS);
        } else {
            BatchJobExecutionParams previousJobExecutionNowParam = batchJobExecutionParamsRepository
                    .findByExecutionIdAndName(batchJobExecutions.getContent().get(0).getJobExecutionId(), "now");
            start = Instant.parse(previousJobExecutionNowParam.getParameterValue());

        }

        Instant to = now;

        // Prepare criteria for each step
        DocumentCriteria documentCriteria = DocumentCriteria.builder()
                .updatedBetween(new TimePeriodDTO(start, to))
                .build();

        DocumentInstanceSectionCriteria sectionCriteria = DocumentInstanceSectionCriteria.builder()
                .updatedBetween(new TimePeriodDTO(start, to))
                .projectAutoTraining(true)
                .build();


        // Convert to job parameters
        JobParameters splitterParams = documentInstanceCriteriaJobParamsConverter.toDTO(documentCriteria);
        JobParameters trainingParams = documentSectionCriteriaJobParamsConverter.toDTO(sectionCriteria);

//        JobParameters params = new JobParametersBuilder()
//                .addJobParameters(splitterParams)
//                .addJobParameters(trainingParams)
//                .addString("now", now.toString())
//                .addString("skipUnchangedDocs", "true")
//                .addString("skipKnownEmbeddings", "true")
//                .toJobParameters();

        // Build all job params
        JobParametersBuilder builder = new JobParametersBuilder()
                .addJobParameters(splitterParams)
                .addJobParameters(trainingParams)
                .addString("now", now.toString())
                .addString("skipUnchangedDocs", "true")
                .addString("skipKnownEmbeddings", "true");

        if (projectId != null) {
            builder.addString("projectId", projectId.toString());
        }

        JobParameters params = builder.toJobParameters();

        return jobLauncher.run(splitterAndTrainingJob, params);
    }
}

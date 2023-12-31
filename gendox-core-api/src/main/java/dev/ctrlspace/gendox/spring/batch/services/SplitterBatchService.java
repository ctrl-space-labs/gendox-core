package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class SplitterBatchService {

    @Value("${gendox.batch-jobs.document-splitter.job.name}")
    private String documentSplitterJobName;

    @Autowired
    private BatchJobExecutionRepository batchJobExecutionRepository;
    @Autowired
    private BatchJobExecutionParamsRepository batchJobExecutionParamsRepository;
    @Autowired
    private DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter;
    @Autowired
    private Job documentSplitterJob;
    @Autowired
    private JobLauncher jobLauncher;

    public JobExecution runAutoSplitter() throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {


        BatchExecutionCriteria criteria = BatchExecutionCriteria.builder()
                .jobName(documentSplitterJobName)
                .status("COMPLETED")
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


//      prepare Job execution params
        DocumentCriteria documentCriteria = DocumentCriteria.builder()
                .updatedBetween(new TimePeriodDTO(start, to))
                .build();

        JobParameters params = documentInstanceCriteriaJobParamsConverter.toDTO(documentCriteria);
        params = new JobParametersBuilder(params)
                .addString("now", now.toString())
                .toJobParameters();

        return jobLauncher.run(documentSplitterJob, params);


    }
}

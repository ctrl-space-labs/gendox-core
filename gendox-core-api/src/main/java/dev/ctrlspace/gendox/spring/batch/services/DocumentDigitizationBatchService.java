package dev.ctrlspace.gendox.spring.batch.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import org.slf4j.Logger;
import org.springframework.batch.core.*;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DocumentDigitizationBatchService {
    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentDigitizationBatchService.class);

    @Value("${gendox.batch-jobs.document-digitization.job.name}")
    private String documentDigitizationJobName;

    private final Job documentDigitizationJob;
    private final JobLauncher jobLauncher;

    @Autowired
    public DocumentDigitizationBatchService(
            Job documentDigitizationJob,
            JobLauncher jobLauncher) {
        this.documentDigitizationJob = documentDigitizationJob;
        this.jobLauncher = jobLauncher;
    }

    /**
     * Run Document Digitization batch job for a specific Task ID
     */
    public JobExecution runDocumentDigitization(UUID taskId, TaskNodeCriteria criteria)  throws JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException, GendoxException {
        logger.info("Starting Document Digitization job for Task ID: {}", taskId);

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();
        paramsBuilder.addString("taskId", taskId.toString());
        ObjectMapper mapper = new ObjectMapper();

        if (criteria.getDocumentNodeIds() != null && !criteria.getDocumentNodeIds().isEmpty()) {
            try {
                String documentNodeIdsJson = mapper.writeValueAsString(criteria.getDocumentNodeIds());
                paramsBuilder.addString("documentNodeIds", documentNodeIdsJson);
            } catch (Exception e) {
                throw new GendoxException("FAILED_TO_SERIALIZE_DOCUMENT_NODE", "Failed to serialize documentNodeIds to JSON", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        paramsBuilder.addLong("run.id", System.currentTimeMillis());
        paramsBuilder.addString("reGenerateExistingAnswers", criteria.getReGenerateExistingAnswers() != null ? criteria.getReGenerateExistingAnswers().toString() : "false");
        paramsBuilder.addString("jobName", documentDigitizationJobName);


        JobParameters jobParameters = paramsBuilder.toJobParameters();

        JobExecution jobExecution = jobLauncher.run(documentDigitizationJob, jobParameters);
        logger.info("Document Digitization job started with execution ID: {}", jobExecution.getId());
        return jobExecution;
    }

}

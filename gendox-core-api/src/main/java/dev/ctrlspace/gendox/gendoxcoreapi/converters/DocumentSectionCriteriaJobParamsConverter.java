package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DocumentSectionCriteriaJobParamsConverter implements GendoxConverter<DocumentInstanceSectionCriteria, JobParameters> {


    @Override
    public JobParameters toDTO(DocumentInstanceSectionCriteria criteria) {

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();
        if (criteria.getDocumentId() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.DOCUMENT_INSTANCE_ID, criteria.getDocumentId());
        }
        if (criteria.getProjectId() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.PROJECT_ID, criteria.getProjectId());
        } else {
            // Exclude jobs that have projectId set (only jobs without projectId)
            paramsBuilder.addString(JobExecutionParamConstants.PROJECT_ID, JobExecutionParamConstants.ALL_PROJECTS);
        }

        if (criteria.getCreatedBetween() != null && criteria.getCreatedBetween().from() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.CREATED_BETWEEN_FROM, criteria.getCreatedBetween().from().toString());
        }
        if (criteria.getCreatedBetween() != null && criteria.getCreatedBetween().to() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.CREATED_BETWEEN_TO, criteria.getCreatedBetween().to().toString());
        }
        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().from() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.UPDATED_BETWEEN_FROM, criteria.getUpdatedBetween().from().toString());
        }
        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().to() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.UPDATED_BETWEEN_TO, criteria.getUpdatedBetween().to().toString());
        }
        if (criteria.getProjectAutoTraining() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.PROJECT_AUTO_TRAINING, criteria.getProjectAutoTraining().toString());
        }

        return paramsBuilder.toJobParameters();
    }

    @Override
    public DocumentInstanceSectionCriteria toEntity(JobParameters jobParameters) {

        TimePeriodDTO createdBetween = null;
        TimePeriodDTO updatedBetween = null;
        if (jobParameters.getString(JobExecutionParamConstants.CREATED_BETWEEN_FROM) != null) {
            createdBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString(JobExecutionParamConstants.CREATED_BETWEEN_FROM)),
                    Instant.parse(jobParameters.getString(JobExecutionParamConstants.CREATED_BETWEEN_TO))
            );
        }
        if (jobParameters.getString(JobExecutionParamConstants.UPDATED_BETWEEN_FROM) != null) {
            updatedBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString(JobExecutionParamConstants.UPDATED_BETWEEN_FROM)),
                    Instant.parse(jobParameters.getString(JobExecutionParamConstants.UPDATED_BETWEEN_TO))
            );
        }

        String projectId = jobParameters.getString(JobExecutionParamConstants.PROJECT_ID);

        if (projectId == null || "null".equalsIgnoreCase(projectId.trim()) || JobExecutionParamConstants.ALL_PROJECTS.equals(projectId.trim())) {
            projectId = null;
        }

        DocumentInstanceSectionCriteria.DocumentInstanceSectionCriteriaBuilder builder =
                DocumentInstanceSectionCriteria.builder()
                        .documentId(jobParameters.getString(JobExecutionParamConstants.DOCUMENT_INSTANCE_ID))
                        .projectAutoTraining(Boolean.valueOf(jobParameters.getString(JobExecutionParamConstants.PROJECT_AUTO_TRAINING)))
                        .createdBetween(createdBetween)
                        .updatedBetween(updatedBetween);

        if (projectId != null) {
            builder.projectId(projectId);
        }

        return builder.build();

    }
}

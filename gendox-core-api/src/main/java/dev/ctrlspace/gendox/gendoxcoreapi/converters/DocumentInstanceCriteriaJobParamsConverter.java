package dev.ctrlspace.gendox.gendoxcoreapi.converters;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DocumentInstanceCriteriaJobParamsConverter implements GendoxConverter<DocumentCriteria, JobParameters> {

    @Override
    public JobParameters toDTO(DocumentCriteria criteria) {

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();

        if (criteria.getProjectId() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.PROJECT_ID, criteria.getProjectId());
        } else {
            // Exclude jobs that have projectId set (only jobs without projectId)
            paramsBuilder.addString(JobExecutionParamConstants.PROJECT_ID, JobExecutionParamConstants.ALL_PROJECTS);
        }

        if (criteria.getOrganizationId() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.ORGANIZATION_ID, criteria.getOrganizationId());
        }
        if (criteria.getDocumentInstanceId() != null) {
            paramsBuilder.addString(JobExecutionParamConstants.DOCUMENT_INSTANCE_ID, criteria.getDocumentInstanceId());
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

        return paramsBuilder.toJobParameters();
    }

    @Override
    public DocumentCriteria toEntity(JobParameters jobParameters) {

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

        DocumentCriteria.DocumentCriteriaBuilder builder = DocumentCriteria.builder()
                .organizationId(jobParameters.getString(JobExecutionParamConstants.ORGANIZATION_ID))
                .documentInstanceId(jobParameters.getString(JobExecutionParamConstants.DOCUMENT_INSTANCE_ID))
                .createdBetween(createdBetween)
                .updatedBetween(updatedBetween);

        if (projectId != null) {
            builder.projectId(projectId);
        }

        return builder.build();

    }
}

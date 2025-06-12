package dev.ctrlspace.gendox.gendoxcoreapi.converters;


import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
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
            paramsBuilder.addString("projectId", criteria.getProjectId());
        } else {
            // Exclude jobs that have projectId set (only jobs without projectId)
            paramsBuilder.addString("projectId", "ALL_PROJECTS");
        }

        if (criteria.getOrganizationId() != null) {
            paramsBuilder.addString("organizationId", criteria.getOrganizationId());
        }
        if (criteria.getDocumentInstanceId() != null) {
            paramsBuilder.addString("documentInstanceId", criteria.getDocumentInstanceId());
        }

        if (criteria.getCreatedBetween() != null && criteria.getCreatedBetween().from() != null) {
            paramsBuilder.addString("createdBetween.from", criteria.getCreatedBetween().from().toString());
        }
        if (criteria.getCreatedBetween() != null && criteria.getCreatedBetween().to() != null) {
            paramsBuilder.addString("createdBetween.to", criteria.getCreatedBetween().to().toString());
        }
        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().from() != null) {
            paramsBuilder.addString("updatedBetween.from", criteria.getUpdatedBetween().from().toString());
        }
        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().to() != null) {
            paramsBuilder.addString("updatedBetween.to", criteria.getUpdatedBetween().to().toString());
        }

        return paramsBuilder.toJobParameters();
    }

    @Override
    public DocumentCriteria toEntity(JobParameters jobParameters) {

        TimePeriodDTO createdBetween = null;
        TimePeriodDTO updatedBetween = null;
        if (jobParameters.getString("createdBetween.from") != null) {
            createdBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString("createdBetween.from")),
                    Instant.parse(jobParameters.getString("createdBetween.to"))
            );
        }
        if (jobParameters.getString("updatedBetween.from") != null) {
            updatedBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString("updatedBetween.from")),
                    Instant.parse(jobParameters.getString("updatedBetween.to"))
            );
        }

        String projectId = jobParameters.getString("projectId");

        if (projectId == null || "null".equalsIgnoreCase(projectId.trim()) || "ALL_PROJECTS".equals(projectId.trim())) {
            projectId = null;
        }

        DocumentCriteria.DocumentCriteriaBuilder builder = DocumentCriteria.builder()
                .organizationId(jobParameters.getString("organizationId"))
                .documentInstanceId(jobParameters.getString("documentInstanceId"))
                .createdBetween(createdBetween)
                .updatedBetween(updatedBetween);

        if (projectId != null) {
            builder.projectId(projectId);
        }

        return builder.build();

    }
}

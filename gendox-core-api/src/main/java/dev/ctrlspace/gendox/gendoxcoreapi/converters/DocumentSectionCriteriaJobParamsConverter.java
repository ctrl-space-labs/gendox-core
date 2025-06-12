package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TimePeriodDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
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
            paramsBuilder.addString("documentInstanceId", criteria.getDocumentId());
        }
        if (criteria.getProjectId() != null) {
            paramsBuilder.addString("projectId", criteria.getProjectId());
        } else {
            // Exclude jobs that have projectId set (only jobs without projectId)
            paramsBuilder.addString("projectId", "ALL_PROJECTS");
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
        if (criteria.getProjectAutoTraining() != null) {
            paramsBuilder.addString("projectAutoTraining", criteria.getProjectAutoTraining().toString());
        }

        return paramsBuilder.toJobParameters();
    }

    @Override
    public DocumentInstanceSectionCriteria toEntity(JobParameters jobParameters) {

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

        DocumentInstanceSectionCriteria.DocumentInstanceSectionCriteriaBuilder builder =
                DocumentInstanceSectionCriteria.builder()
                        .documentId(jobParameters.getString("documentInstanceId"))
                        .projectAutoTraining(Boolean.valueOf(jobParameters.getString("projectAutoTraining")))
                        .createdBetween(createdBetween)
                        .updatedBetween(updatedBetween);

        if (projectId != null) {
            builder.projectId(projectId);
        }

        return builder.build();

    }
}

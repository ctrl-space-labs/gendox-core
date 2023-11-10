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
    public JobParameters toDTO(DocumentInstanceSectionCriteria criteria) throws GendoxException {

        JobParametersBuilder paramsBuilder = new JobParametersBuilder();
        if (criteria.getDocumentId() != null) {
            paramsBuilder.addString("documentInstanceId", "cc410aed-3295-43f1-b172-3d97d40c0da8");
        }
        if (criteria.getProjectId() != null) {
            paramsBuilder.addString("projectId", "993b935a-441f-4428-aa0a-cc6ece6705db");
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
    public DocumentInstanceSectionCriteria toEntity(JobParameters jobParameters) {

        TimePeriodDTO createdBetween = null;
        TimePeriodDTO updatedBetween = null;
        if (jobParameters.getString("createdBetween.from") != null) {
            createdBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString("createdBetween.from")),
                    Instant.parse(jobParameters.getString("createdBetween.to"))
            );
        }
        if (jobParameters.getString("from") != null) {
            updatedBetween = new TimePeriodDTO(
                    Instant.parse(jobParameters.getString("updatedBetween.from")),
                    Instant.parse(jobParameters.getString("updatedBetween.to"))
            );
        }

        return DocumentInstanceSectionCriteria.builder()
                .documentId(jobParameters.getString("documentInstanceId"))
                .projectId(jobParameters.getString("projectId"))
                .createdBetween(createdBetween)
                .updatedBetween(updatedBetween)
                .build();
    }
}

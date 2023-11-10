package dev.ctrlspace.gendox.etljobs.training.steps;

import com.querydsl.core.types.Predicate;
import dev.ctrlspace.gendox.etljobs.common.GendoxJpaPeriodReader;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.NonTransientResourceException;
import org.springframework.batch.item.ParseException;
import org.springframework.batch.item.UnexpectedInputException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class DocumentInstanceReader extends GendoxJpaPeriodReader<DocumentInstance> {

    private DocumentCriteria criteria;

    private DocumentService documentService;

    @Autowired
    public DocumentInstanceReader(DocumentService documentService) {
        this.documentService = documentService;
    }


    @Override
    public DocumentInstance read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {
        return super.read();
    }

    @Override
    protected void initializeJpaPredicate(JobParameters jobParameters) {
        criteria = DocumentCriteria.builder()
                .documentInstanceId(jobParameters.getString("documentInstanceId"))
//                .documentInstanceIds(jobParameters.getString("documentInstanceIds"))
                .organizationId(jobParameters.getString("organizationId"))
                .projectId(jobParameters.getString("projectId"))
                .build();
    }

    @Override
    protected Page<DocumentInstance> getPageFromRepository(Pageable pageable) throws GendoxException {
        return documentService.getAllDocuments(criteria, pageable);
    }
}

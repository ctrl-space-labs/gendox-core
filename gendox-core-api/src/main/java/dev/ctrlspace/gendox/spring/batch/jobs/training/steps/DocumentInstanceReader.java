package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.spring.batch.jobs.common.GendoxJpaPageReader;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import org.springframework.batch.core.ExitStatus;
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
public class DocumentInstanceReader extends GendoxJpaPageReader<DocumentInstance> {

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
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        criteria = DocumentCriteria.builder()
                .documentInstanceId(jobParameters.getString("documentInstanceId"))
//                .documentInstanceIds(jobParameters.getString("documentInstanceIds"))
                .organizationId(jobParameters.getString("organizationId"))
                .projectId(jobParameters.getString("projectId"))
                .build();
        return null;
    }

    @Override
    protected Page<DocumentInstance> getPageFromRepository(Pageable pageable) throws GendoxException {
        return documentService.getAllDocuments(criteria, pageable);
    }

    @Override
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

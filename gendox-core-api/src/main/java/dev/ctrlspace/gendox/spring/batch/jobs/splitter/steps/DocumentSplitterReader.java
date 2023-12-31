package dev.ctrlspace.gendox.spring.batch.jobs.splitter.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.spring.batch.jobs.common.GendoxJpaPageReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class DocumentSplitterReader extends GendoxJpaPageReader<DocumentInstance> {

    Logger logger = LoggerFactory.getLogger(getClass());
    private DocumentService documentService;

    private DocumentCriteria criteria;
    private Sort sort;

    private DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter;

    @Autowired
    public DocumentSplitterReader(DocumentService documentService,
                                  DocumentInstanceCriteriaJobParamsConverter documentInstanceCriteriaJobParamsConverter) {
        this.documentService = documentService;
        this.documentInstanceCriteriaJobParamsConverter = documentInstanceCriteriaJobParamsConverter;
    }

    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        //sort by documentInstanceId desc and createdAt asc
        sort = Sort.by(Sort.Direction.DESC, "organizationId").and(Sort.by(Sort.Direction.ASC, "updatedAt"));
        criteria = documentInstanceCriteriaJobParamsConverter.toEntity(jobParameters);
        // validate criteria
        // now is mandatory for all readers before job execution
        if (super.now == null) {
            logger.error("Job parameter 'now' is mandatory for all readers");
            return ExitStatus.FAILED;
        }

        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().to() != null
                && criteria.getUpdatedBetween().to().isAfter(now)) {
            logger.error("Job parameter 'to' must not be in the future");
            return ExitStatus.FAILED;
        }

        if (criteria.getUpdatedBetween() != null && criteria.getUpdatedBetween().from() != null
                && criteria.getUpdatedBetween().to() != null
                && criteria.getUpdatedBetween().from()
                .isAfter(criteria.getUpdatedBetween().to())) {
            logger.error("Job parameter 'from' must be before 'to'");
            return ExitStatus.FAILED;
        }

        if (pageSize <= 0 || pageSize > 1000) {
            logger.error("Job parameter 'pageSize' must be between 1 and 1000");
            return ExitStatus.FAILED;
        }
        return null;
    }

    @Override
    protected Page<DocumentInstance> getPageFromRepository(Pageable pageable) throws GendoxException {
        PageRequest sortedPageRequest = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        return documentService.getAllDocuments(criteria, sortedPageRequest);
    }

    @Override
    @Value("${gendox.batch-jobs.document-splitter.job.steps.document-splitter-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

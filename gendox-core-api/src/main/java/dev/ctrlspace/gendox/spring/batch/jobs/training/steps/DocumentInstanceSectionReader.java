package dev.ctrlspace.gendox.spring.batch.jobs.training.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.spring.batch.jobs.common.GendoxJpaPageReader;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentSectionCriteriaJobParamsConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
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
public class DocumentInstanceSectionReader extends GendoxJpaPageReader<DocumentInstanceSection> {

    Logger logger = LoggerFactory.getLogger(getClass());

    private DocumentInstanceSectionCriteria criteria;
    private Sort sort;

    private DocumentSectionService documentSectionService;


    private DocumentSectionCriteriaJobParamsConverter documentSectionCriteriaJobParamsConverter;

    @Autowired
    public DocumentInstanceSectionReader(DocumentSectionService documentSectionService,
                                         DocumentSectionCriteriaJobParamsConverter documentSectionCriteriaJobParamsConverter) {
        this.documentSectionService = documentSectionService;
        this.documentSectionCriteriaJobParamsConverter = documentSectionCriteriaJobParamsConverter;
    }

    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        //sort by documentInstanceId desc and createdAt asc
        sort = Sort.by(Sort.Direction.DESC, "documentInstanceId").and(Sort.by(Sort.Direction.ASC, "createdAt"));
        criteria = documentSectionCriteriaJobParamsConverter.toEntity(jobParameters);

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
    protected Page<DocumentInstanceSection> getPageFromRepository(Pageable pageable) throws GendoxException {

        PageRequest sortedPageRequest = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        return documentSectionService.getAllSections(criteria, sortedPageRequest);
    }

    @Override
    @Value("${gendox.batch-jobs.document-training.job.steps.document-training-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }


}

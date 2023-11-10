package dev.ctrlspace.gendox.spring.batch.jobs.common;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.annotation.BeforeStep;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Iterator;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

/**
 * A common JPA Reader for Spring Batch jobs. Generics are used to describe the input and output types.
 * Each Reader will get a Params object what will include at least the period of time to read from the DB.
 * <p>
 * Different Gendox Readers will just extend this one to provide, reader-specific implementation.
 */
@StepScope
public abstract class GendoxJpaPeriodReader<T> implements ItemStreamReader<T> {
    Logger logger = LoggerFactory.getLogger(getClass());

    private final Lock lock = new ReentrantLock();

    private JpaRepository<T, ?> repository;
    private Iterator<T> currentPageIterator;
    private Page<T> currentPage;

    private int currentPageIndex;
    private int totalItemCounter;
    private int pageItemCounter;

    protected Integer pageSize;

    @Value("#{jobParameters['now']}")
    protected Instant now;

    @BeforeStep
    public ExitStatus beforeStep(StepExecution stepExecution) {

        currentPageIndex = -1;
        totalItemCounter = -1;
        pageItemCounter = -1;


        return this.initializeJpaPredicate(stepExecution.getJobParameters());


    }


    @Override
    public T read() throws Exception, UnexpectedInputException, ParseException, NonTransientResourceException {

        this.lock.lock();
        try {
            return readThreadUnsafe();
        }
        finally {
            this.lock.unlock();
        }
    }

    @Nullable
    private T readThreadUnsafe() throws GendoxException {
        //first page or next page
        if (currentPage == null || !currentPageIterator.hasNext() && currentPage.hasNext()) {
            currentPage = fetchNextPage();
            pageItemCounter = 0;
            currentPageIterator = currentPage.iterator();
            logger.debug("Read page #{} (item #{} from total of pages#{})",
                    currentPage.getNumber(), totalItemCounter, currentPage.getTotalPages());
        }

        if (!currentPageIterator.hasNext()) {
            return null;
        }
        totalItemCounter++;
        pageItemCounter++;
        logger.trace("Read item #{} from page #{} (item #{} from total of #{})",
                pageItemCounter, currentPage.getNumber(), totalItemCounter, currentPage.getTotalElements());
        return currentPageIterator.next();
    }

    private Page<T> fetchNextPage() throws GendoxException {
        currentPageIndex++;
        Pageable pageable = PageRequest.of(currentPageIndex, pageSize);
        return getPageFromRepository(pageable);
    }

    /**
     * Subclasses will implement this method to define how to initialize the Predicates
     * that will applied in JPA getPage query.
     *
     * Parameter validation should be done here and if there is an issue, the method should return the appropriate ExitStatus
     *
     * @param jobParameters
     * @return The {@link ExitStatus} to end the Job or null if everything is OK
     */
    protected abstract ExitStatus initializeJpaPredicate(JobParameters jobParameters);

    /**
     * Subclasses will implement this method to define how to use the repository to fetch the page.
      */
    protected abstract Page<T> getPageFromRepository(Pageable pageable) throws GendoxException;

    /**
     * Each Reader should have its own pageSize
     * @param pageSize
     */
    public abstract void setPageSize(Integer pageSize);

}

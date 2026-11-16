package dev.ctrlspace.gendox.spring.batch.jobs.common;

import dev.ctrlspace.gendox.spring.batch.model.BatchJobExecution;
import dev.ctrlspace.gendox.spring.batch.repositories.BatchJobExecutionRepository;
import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.job.JobInstance;
import org.springframework.batch.core.job.flow.FlowExecutionStatus;
import org.springframework.batch.core.job.parameters.JobParametersBuilder;
import org.springframework.batch.core.launch.JobOperator;
import org.springframework.batch.core.repository.JobRepository;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * One run of a job per project at a time: a second run that starts while one is going is
 * skipped. The rule must never leave a project with no run at all.
 */
class UniqueInstanceDeciderTest {

    private static final String JOB = "documentSplitterJob";
    private static final String PROJECT = "6f1c2f4e-2d6a-4c55-9a64-0f3e6f2b1d10";
    private static final FlowExecutionStatus CONTINUE = new FlowExecutionStatus("CONTINUE");

    private final BatchJobExecutionRepository repository = mock(BatchJobExecutionRepository.class);
    private final UniqueInstanceDecider decider = new UniqueInstanceDecider(mock(JobRepository.class), repository,
            mock(JobOperator.class), Duration.ofHours(1));

    @Test
    void aRunLeftStartedByAStoppedServerDoesNotBlockTheProjectForever() {
        // a deploy or crash two days ago left its execution STARTED; nothing has updated it since
        Instant now = Instant.now();
        BatchJobExecution abandoned = row(1L, now.minus(Duration.ofDays(2)), now.minus(Duration.ofDays(2)));
        BatchJobExecution current = row(2L, now, now);
        startedAre(abandoned, current);

        assertThat(decider.decide(execution(2L), null)).isEqualTo(CONTINUE);
    }

    @Test
    void ofTwoRunsStartedAtTheSameMomentTheFirstGoesAheadAndTheSecondIsADuplicate() {
        // both are STARTED before either decides, so each sees the other
        Instant now = Instant.now();
        startedAre(row(10L, now, now), row(11L, now.plusMillis(5), now.plusMillis(5)));

        assertThat(decider.decide(execution(10L), null)).isEqualTo(CONTINUE);
        assertThat(decider.decide(execution(11L), null)).isEqualTo(new FlowExecutionStatus("DUPLICATE_EXECUTION"));
    }

    @Test
    void aLongRunThatKeepsWritingProgressIsStillGoing() {
        // thousands of files: started ten hours ago, but its step wrote a chunk a minute ago
        Instant now = Instant.now();
        BatchJobExecution longRun = row(30L, now.minus(Duration.ofHours(10)), now.minus(Duration.ofHours(10)));
        startedAre(longRun, row(31L, now, now));
        when(repository.findLastStepUpdate(30L)).thenReturn(Timestamp.from(now.minus(Duration.ofMinutes(1))));

        assertThat(decider.decide(execution(31L), null)).isEqualTo(new FlowExecutionStatus("DUPLICATE_EXECUTION"));
    }

    @Test
    void aRunStartedWhileAnotherIsGoingIsSkipped() {
        // the rule itself: today's behavior, kept
        Instant now = Instant.now();
        startedAre(row(20L, now.minusSeconds(30), now.minusSeconds(1)), row(21L, now, now));

        assertThat(decider.decide(execution(21L), null)).isNotEqualTo(CONTINUE);
    }

    private void startedAre(BatchJobExecution... rows) {
        when(repository.findJobExecutionByJobNameAndStatusAndProjectParam(anyString(), anyString(), anyString()))
                .thenReturn(List.of(rows));
        when(repository.findJobExecutionByJobNameAndStatus(anyString(), anyString()))
                .thenReturn(List.of(rows));
    }

    private static BatchJobExecution row(Long id, Instant startTime, Instant lastUpdated) {
        BatchJobExecution row = new BatchJobExecution();
        row.setJobExecutionId(id);
        row.setStatus("STARTED");
        row.setCreateTime(startTime);
        row.setStartTime(startTime);
        row.setLastUpdated(lastUpdated);
        return row;
    }

    private static JobExecution execution(Long id) {
        JobInstance instance = mock(JobInstance.class);
        when(instance.getJobName()).thenReturn(JOB);
        JobExecution execution = mock(JobExecution.class);
        when(execution.getId()).thenReturn(id);
        when(execution.getJobInstance()).thenReturn(instance);
        when(execution.getJobParameters()).thenReturn(new JobParametersBuilder()
                .addString(JobExecutionParamConstants.PROJECT_ID, PROJECT)
                .toJobParameters());
        return execution;
    }
}

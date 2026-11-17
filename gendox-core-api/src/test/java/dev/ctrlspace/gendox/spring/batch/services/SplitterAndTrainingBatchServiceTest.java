package dev.ctrlspace.gendox.spring.batch.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.QueueMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.spring.batch.utils.JobUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.BatchStatus;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.batch.core.launch.JobRestartException;
import org.springframework.data.domain.PageImpl;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * The upload poller hands each batch of "document uploaded" messages to this service, then marks
 * the batch handled when it returns. A message marked handled is never looked at again, so the
 * service may return only when the uploaded documents of every project in the batch were processed.
 */
class SplitterAndTrainingBatchServiceTest {

    private final ObjectMapper json = JsonMapper.builder().build();
    private final SplitterBatchService splitter = mock(SplitterBatchService.class);
    private final TrainingBatchService training = mock(TrainingBatchService.class);
    private final ProjectService projectService = mock(ProjectService.class);
    private final UUID first = UUID.randomUUID();
    private final UUID second = UUID.randomUUID();

    private SplitterAndTrainingBatchService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new SplitterAndTrainingBatchService(mock(JobUtils.class), splitter, training, json, projectService,
                "document-upload", "attachment-upload");
        when(projectService.getAllProjects(any(), any())).thenReturn(new PageImpl<>(List.of(project(first), project(second))));
        JobExecution completed = execution(BatchStatus.COMPLETED, ExitStatus.COMPLETED);
        when(splitter.runAutoSplitter(any(), any())).thenReturn(completed);
        when(training.runAutoTraining(any(), any())).thenReturn(completed);
    }

    @Test
    void oneProjectsFailureDoesNotStopTheOtherProjectsInTheBatch() throws Exception {
        when(splitter.runAutoSplitter(eq(first), any())).thenThrow(new JobRestartException("could not start"));

        try {
            service.runSplitterAndTrainingForBatchOfFiles(batch(first, second));
        } catch (RuntimeException reported) {
            // reporting the failure is expected; skipping the second project is not
        }

        verify(splitter).runAutoSplitter(eq(second), any());
        verify(training).runAutoTraining(eq(second), any());
    }

    @Test
    @Disabled("Ticket: the upload is not lost, but it waits for the next trigger (another upload, Process now or an integration sync). Decide whether the poller should run again once the running job ends.")
    void aRunSkippedBecauseAnotherWasGoingIsNotReportedAsHandled() throws Exception {
        // the run already going started before this upload, so it does not include it
        JobExecution skipped = execution(BatchStatus.COMPLETED, new ExitStatus("DUPLICATE_EXECUTION"));
        when(splitter.runAutoSplitter(eq(first), any())).thenReturn(skipped);
        when(training.runAutoTraining(eq(first), any())).thenReturn(skipped);

        assertThrows(Exception.class, () -> service.runSplitterAndTrainingForBatchOfFiles(batch(first)));
    }

    @Test
    @Disabled("Ticket: a failed run's upload messages are acknowledged; the queue consumer marks a thrown batch DEAD (no retry), so the fix spans both.")
    void aFailedRunIsNotReportedAsHandled() throws Exception {
        JobExecution failed = execution(BatchStatus.FAILED, ExitStatus.FAILED);
        when(training.runAutoTraining(eq(first), any())).thenReturn(failed);

        assertThrows(Exception.class, () -> service.runSplitterAndTrainingForBatchOfFiles(batch(first)));
    }

    @Test
    void aBatchWhoseRunsCompletedIsHandled() throws Exception {
        // the control for the tests above
        service.runSplitterAndTrainingForBatchOfFiles(batch(first, second));

        verify(training).runAutoTraining(eq(first), any());
        verify(training).runAutoTraining(eq(second), any());
    }

    private List<QueueMessage> batch(UUID... projectIds) {
        return java.util.Arrays.stream(projectIds).map(id -> {
            QueueMessage message = new QueueMessage();
            message.setTopic("document-upload");
            message.setPayload(json.valueToTree(Map.of("projectId", id.toString())));
            return message;
        }).toList();
    }

    private static Project project(UUID id) {
        Project project = new Project();
        project.setId(id);
        project.setAutoTraining(true);
        return project;
    }

    private static JobExecution execution(BatchStatus status, ExitStatus exitStatus) {
        JobExecution execution = mock(JobExecution.class);
        when(execution.getStatus()).thenReturn(status);
        when(execution.getExitStatus()).thenReturn(exitStatus);
        when(execution.isRunning()).thenReturn(false);
        return execution;
    }
}

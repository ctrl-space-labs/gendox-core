package dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.steps;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import dev.ctrlspace.gendox.spring.batch.utils.JobExecutionParamConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.ExitStatus;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.StepExecution;
import org.springframework.batch.core.StepExecutionListener;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.stereotype.Component;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.JobService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;

@Component
public class DeepThinkingTasklet implements Tasklet, StepExecutionListener {

    private static final Logger logger = LoggerFactory.getLogger(DeepThinkingTasklet.class);

    private final CompletionService completionService;
    private final MessageService messageService;
    private final ProjectService projectService;
    private final JobService jobService;

    public DeepThinkingTasklet(CompletionService completionService,
                               MessageService messageService,
                               ProjectService projectService,
                               JobService jobService) {
        this.completionService = completionService;
        this.messageService = messageService;
        this.projectService = projectService;
        this.jobService = jobService;
    }

    @Override
    public void beforeStep(StepExecution stepExecution) {
        // no-op
    }

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        StepExecution currentStepExecution = contribution.getStepExecution();
        String messageId = currentStepExecution.getJobParameters().getString(JobExecutionParamConstants.MESSAGE_ID);
        String projectId = currentStepExecution.getJobParameters().getString(JobExecutionParamConstants.PROJECT_ID);

        Message message = messageService.getMessageById(UUID.fromString(messageId));
        Project project = projectService.getProjectById(UUID.fromString(projectId));

        CancellationToken cancellationToken = new CancellationToken(
                () -> isCancellationRequested(contribution.getStepExecution()));

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(cancellationToken)
                .build();

        try {
            List<Message> completions = completionService.getCompletion(
                    message, topSectionsForCompletion, project, null, overrides);

            logger.info("Deep thinking completed for message {} with {} response messages",
                    messageId, completions.size());
        } catch (Exception e) {
            if (cancellationToken.isCancelled()) {
                logger.info("Deep thinking cancelled for message {}", messageId);
                contribution.setExitStatus(ExitStatus.STOPPED);
                return RepeatStatus.FINISHED;
            }
            throw e;
        }

        return RepeatStatus.FINISHED;
    }

    @Override
    public ExitStatus afterStep(StepExecution stepExecution) {
        return stepExecution.getExitStatus();
    }

    /**
     * Delegates cancellation detection to JobService where the DB read runs
     * in a dedicated transaction.
     */
    private boolean isCancellationRequested(StepExecution stepExecution) {
        return jobService.isDeepThinkingCancellationRequested(stepExecution.getJobExecutionId(), stepExecution.isTerminateOnly());
    }
}

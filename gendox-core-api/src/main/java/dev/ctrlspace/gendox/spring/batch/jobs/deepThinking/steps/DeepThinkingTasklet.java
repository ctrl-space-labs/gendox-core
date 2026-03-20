package dev.ctrlspace.gendox.spring.batch.jobs.deepThinking.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class DeepThinkingTasklet implements Tasklet, StepExecutionListener {

    private static final Logger logger = LoggerFactory.getLogger(DeepThinkingTasklet.class);

    private final CompletionService completionService;
    private final MessageService messageService;
    private final ProjectService projectService;
    private final EmbeddingService embeddingService;

    private StepExecution stepExecution;

    public DeepThinkingTasklet(CompletionService completionService,
                               MessageService messageService,
                               ProjectService projectService,
                               EmbeddingService embeddingService) {
        this.completionService = completionService;
        this.messageService = messageService;
        this.projectService = projectService;
        this.embeddingService = embeddingService;
    }

    @Override
    public void beforeStep(StepExecution stepExecution) {
        this.stepExecution = stepExecution;
    }

    @Override
    public RepeatStatus execute(StepContribution contribution, ChunkContext chunkContext) throws Exception {
        String messageId = stepExecution.getJobParameters().getString(JobExecutionParamConstants.MESSAGE_ID);
        String projectId = stepExecution.getJobParameters().getString(JobExecutionParamConstants.PROJECT_ID);

        Message message = messageService.getMessageById(UUID.fromString(messageId));
        Project project = projectService.getProjectById(UUID.fromString(projectId));

        CancellationToken cancellationToken = new CancellationToken(stepExecution::isTerminateOnly);

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();

        List<DocumentInstanceSectionDTO> sectionDTOs = embeddingService.findClosestSections(
                message,
                project,
                PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue())
        );

        int maxCompletionLimit = project.getProjectAgent().getMaxCompletionLimit().intValue();
        for (int i = 0; i < sectionDTOs.size(); i++) {
            if (i < maxCompletionLimit) {
                topSectionsForCompletion.add(sectionDTOs.get(i));
            }
        }

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(cancellationToken)
                .build();

        try {
            List<Message> completions = completionService.getCompletion(
                    message, topSectionsForCompletion, project, null, overrides);

            logger.info("Deep thinking completed for message {} with {} response messages",
                    messageId, completions.size());
        } catch (Exception e) {
            if (stepExecution.isTerminateOnly()) {
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
}

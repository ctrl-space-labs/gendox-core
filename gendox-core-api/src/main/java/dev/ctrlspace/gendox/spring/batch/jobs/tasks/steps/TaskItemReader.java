package dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
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
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.UUID;

@Component
@StepScope
public class TaskItemReader extends GendoxJpaPageReader<TaskNode> {
    Logger logger = LoggerFactory.getLogger(getClass());
    private TaskService taskService;
    private UUID taskId;

    @Autowired
    public TaskItemReader(TaskService taskService) {
        this.taskService = taskService;
    }

    @Override
    protected ExitStatus initializeJpaPredicate(JobParameters jobParameters) {
        taskId = UUID.fromString(Objects.requireNonNull(jobParameters.getString("taskId")));
        return null;
    }

    @Override
    protected Page<TaskNode> getPageFromRepository(Pageable pageable) throws GendoxException {
        logger.trace("Is virtual thread? {}", Thread.currentThread().isVirtual());
        return taskService.getTaskNodesByTaskId(
                taskId,
                PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort())
        );
    }

    @Override
    @Value("${gendox.batch-jobs.task-job.job.steps.task-step.pageable-size}")
    public void setPageSize(Integer pageSize) {
        super.pageSize = pageSize;
    }
}

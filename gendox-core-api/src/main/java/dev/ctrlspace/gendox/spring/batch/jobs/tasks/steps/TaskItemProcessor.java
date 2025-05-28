package dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class TaskItemProcessor implements ItemProcessor<TaskNode, TaskNode> {

    Logger logger = LoggerFactory.getLogger(TaskItemProcessor.class);
    @Override
    public TaskNode process(TaskNode item) throws Exception {
        logger.info("Processing TaskNode: {}", item.getId());
        return item;
    }
}

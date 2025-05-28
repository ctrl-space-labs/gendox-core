package dev.ctrlspace.gendox.spring.batch.jobs.tasks.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.configuration.annotation.StepScope;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

@Component
@StepScope
public class TaskItemWriter implements ItemWriter<TaskNode> {

    Logger logger = LoggerFactory.getLogger(TaskItemWriter.class);
    @Override
    public void write(Chunk<? extends TaskNode> chunk) throws Exception {
        logger.debug("Start writing TaskNode chunk");
    }
}

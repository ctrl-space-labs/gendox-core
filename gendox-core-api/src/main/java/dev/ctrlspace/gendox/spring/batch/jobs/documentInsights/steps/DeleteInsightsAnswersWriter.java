package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskEdgeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DeleteInsightsAnswersWriter implements ItemWriter<TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DeleteInsightsAnswersWriter.class);

    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;

    @Autowired
    public DeleteInsightsAnswersWriter(TaskNodeService taskNodeService,
                                       TaskEdgeService taskEdgeService) {
        this.taskNodeService = taskNodeService;
        this.taskEdgeService = taskEdgeService;
    }


    @Override
    public void write(Chunk<? extends TaskAnswerBatchDTO> chunk) throws Exception, GendoxException {


        List<UUID> answerIdsToDelete = chunk.getItems().stream()
                .flatMap(answer -> answer.getAnswersToDelete().stream())
                .map(TaskNode::getId)
                .toList();

        logger.debug("Answers to delete {}", answerIdsToDelete.size());

        //Delete existing answer edges and nodes
        if (!answerIdsToDelete.isEmpty()) {
            taskEdgeService.deleteTaskEdgesByFromNodeIds(answerIdsToDelete);
            taskNodeService.deleteTaskNodesByIds(answerIdsToDelete);
        }

    }



}


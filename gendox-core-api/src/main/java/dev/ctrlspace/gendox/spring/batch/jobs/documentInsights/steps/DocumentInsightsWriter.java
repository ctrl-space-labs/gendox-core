package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskEdgeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class DocumentInsightsWriter implements ItemWriter<TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsWriter.class);

    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;

    public DocumentInsightsWriter(TaskNodeService taskNodeService,
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


        //Delete existing answer edges and nodes
        if (!answerIdsToDelete.isEmpty()) {
            taskEdgeService.deleteTaskEdgesByFromNodeIds(answerIdsToDelete);
            taskNodeService.deleteTaskNodesByIds(answerIdsToDelete);
        }

        /// Convert newAnswers DTOs to entities (both TaskNode and edges) and save all
        List<AnswerCreationDTO> newAnswerDTOs = chunk.getItems().stream()
                .flatMap(dto -> dto.getNewAnswers().stream())
                .toList();

        List<TaskEdge> newEdges = taskEdgeService.createAnswerEdges(newAnswerDTOs);

    }


}


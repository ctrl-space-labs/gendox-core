package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
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

    private final TaskNodeRepository taskNodeRepository;
    private final TaskNodeConverter taskNodeConverter;
    private final TaskService taskService;

    public DocumentInsightsWriter(TaskNodeRepository taskNodeRepository,
                                  TaskNodeConverter taskNodeConverter,
                                  TaskService taskService) {
        this.taskNodeRepository = taskNodeRepository;
        this.taskNodeConverter = taskNodeConverter;
        this.taskService = taskService;
    }


    @Override
    public void write(Chunk<? extends TaskAnswerBatchDTO> chunk) throws Exception, GendoxException {


        // TODO Find Answer Ids to be deleted in a single query
        List<TaskNode> answersToDelete = new ArrayList<>();
        for (TaskAnswerBatchDTO documentGroupWithQuestions : chunk.getItems()) {
            for (AnswerCreationDTO answer : documentGroupWithQuestions.getNewAnswers()) {

                Optional<TaskNode> taskNodeOpt = taskService.findAnswerNodeByDocumentAndQuestionOptional(
                        answer.getDocumentNode().getTaskId(),
                        answer.getDocumentNode().getId(),
                        answer.getQuestionNode().getId()
                );
                taskNodeOpt.ifPresent(answersToDelete::add);
            }
        }

        List<UUID> answerIdsToDelete = answersToDelete.stream()
                .map(TaskNode::getId)
                .toList();

        //Delete existing answer edges and nodes
        if (!answerIdsToDelete.isEmpty()) {
            taskService.deleteTaskEdgesByFromNodeIds(answerIdsToDelete);
            taskService.deleteTaskNodesByIds(answerIdsToDelete);
        }

        /// Convert newAnswers DTOs to entities (both TaskNode and edges) and save all
        List<AnswerCreationDTO> newAnswerDTOs = chunk.getItems().stream()
                .flatMap(dto -> dto.getNewAnswers().stream())
                .toList();

        List<TaskEdge> newEdges = taskService.createAnswerEdges(newAnswerDTOs);

    }



}


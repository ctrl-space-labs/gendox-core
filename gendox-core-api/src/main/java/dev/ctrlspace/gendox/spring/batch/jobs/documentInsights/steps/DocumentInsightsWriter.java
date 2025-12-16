package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
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
public class DocumentInsightsWriter implements ItemWriter<TaskAnswerBatchDTO> {

    private static final Logger logger = LoggerFactory.getLogger(DocumentInsightsWriter.class);

    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;

    @Autowired
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

        List<TaskEdge> newEdges = taskEdgeService.createAnswerNodesAndEdges(newAnswerDTOs);

        clearPreviousInsightSummaries(chunk);

    }

    private void clearPreviousInsightSummaries(Chunk<? extends TaskAnswerBatchDTO> chunk) {
        Set<TaskNode> docNodes = chunk.getItems().stream()
                .flatMap(dto -> dto.getNewAnswers().stream())
                .map(AnswerCreationDTO::getDocumentNode)
                .collect(Collectors.toSet());

        // Clear insights summary metadata from document nodes that have new answers
        // the summaries are populated in the processor of next step
        docNodes.
                forEach(docNode -> {
                    if (docNode.getNodeValue().getDocumentMetadata() == null) {
                        docNode.getNodeValue().setDocumentMetadata(new TaskDocumentMetadataDTO());
                        docNode.getNodeValue().getDocumentMetadata().setTaskNodeId(docNode.getId());
                    }
                    // this is probably a migration issue, but just in case
                    if (docNode.getNodeValue().getDocumentMetadata().getTaskNodeId() == null) {
                        docNode.getNodeValue().getDocumentMetadata().setTaskNodeId(docNode.getId());
                    }
                    docNode.getNodeValue().getDocumentMetadata().setInsightsSummary(null);
                    try {
                        taskNodeService.updateTaskNodesMetadata(docNode.getNodeValue().getDocumentMetadata());
                    } catch (GendoxException e) {
                        logger.warn("Failed to update document metadata for node id: {}", docNode.getDocumentId(), e);
                        // skipping metadata update failure
                    }
                });
    }


}


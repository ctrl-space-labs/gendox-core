package dev.ctrlspace.gendox.spring.batch.jobs.documentInsights.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskEdgeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class InsightsSummaryWriter implements ItemWriter<InsightDocumentAnswersWithSummaryDTO> {

    private static final Logger logger = LoggerFactory.getLogger(InsightsSummaryWriter.class);

    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;

    @Autowired
    public InsightsSummaryWriter(TaskNodeService taskNodeService,
                                 TaskEdgeService taskEdgeService) {
        this.taskNodeService = taskNodeService;
        this.taskEdgeService = taskEdgeService;
    }


    @Override
    public void write(Chunk<? extends InsightDocumentAnswersWithSummaryDTO> chunk) throws Exception, GendoxException {


        chunk.getItems().forEach(
                insightDocumentAnswersWithSummaryDTO -> {
                    TaskNode documentNode = insightDocumentAnswersWithSummaryDTO.getDocumentNode();
                    // if the call fails, it will be null eather way
                    CompletionAnswerSummary summary = insightDocumentAnswersWithSummaryDTO.getAnswerSummary();
                    if (documentNode.getNodeValue() == null) {
                        documentNode.setNodeValue(new TaskNodeValueDTO());
                    }
                    if (documentNode.getNodeValue().getDocumentMetadata() == null) {
                        documentNode.getNodeValue().setDocumentMetadata(new TaskDocumentMetadataDTO());
                    }
                    documentNode.getNodeValue().getDocumentMetadata().setInsightsSummary(summary);
                    documentNode.getNodeValue().getDocumentMetadata().setTaskNodeId(documentNode.getId());
                    try {
                        taskNodeService.updateTaskNodesMetadata(documentNode.getNodeValue().getDocumentMetadata());
                    } catch (GendoxException e) {
                        logger.error("Failed to update document node metadata for node id: {} Skipping...", documentNode.getId(), e);
                    }
                }
        );

    }


}


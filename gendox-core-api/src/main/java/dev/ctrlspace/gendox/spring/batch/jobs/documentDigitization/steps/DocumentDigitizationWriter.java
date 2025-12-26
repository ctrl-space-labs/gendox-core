package dev.ctrlspace.gendox.spring.batch.jobs.documentDigitization.steps;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskAnswerBatchDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskEdgeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class DocumentDigitizationWriter implements ItemWriter<TaskAnswerBatchDTO> {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger(DocumentDigitizationWriter.class);

    private final TaskNodeService taskNodeService;
    private final TaskEdgeService taskEdgeService;
    private final TaskNodeRepository taskNodeRepository;

    @Autowired
    public DocumentDigitizationWriter(TaskNodeService taskNodeService,
                                      TaskEdgeService taskEdgeService,
                                      TaskNodeRepository taskNodeRepository) {
        this.taskNodeService = taskNodeService;
        this.taskEdgeService = taskEdgeService;
        this.taskNodeRepository = taskNodeRepository;
    }


    @Override
    @Transactional
    public void write(Chunk<? extends TaskAnswerBatchDTO> chunk) throws Exception, GendoxException {

        List<TaskNode> answerNodesToDelete = chunk.getItems().stream()
                .flatMap(answer -> answer.getAnswersToDelete().stream())
                .filter(node -> {
                    // Check node type before deletion
                    boolean isAnswer = "ANSWER".equals(node.getNodeType().getName());
                    if (!isAnswer) {
                        logger.warn("🛡️ SAFETY GUARD ACTIVATED: Prevented deletion of non-ANSWER node! ID: {}, Type: {}",
                                node.getId(), node.getNodeType().getName());
                    }
                    return isAnswer;
                })
                .toList();

        if (!answerNodesToDelete.isEmpty()) {
            taskEdgeService.deleteTaskEdgesByNodeIds(answerNodesToDelete);

            List<UUID> idsToDelete = answerNodesToDelete.stream().map(TaskNode::getId).toList();
            taskNodeService.deleteTaskNodesByIds(idsToDelete);

            // Flush to ensure deletions are executed before proceeding
            taskNodeRepository.flush();
        }

        List<AnswerCreationDTO> allNewAnswers = chunk.getItems().stream()
                .flatMap(dto -> dto.getNewAnswers().stream())
                .toList();

        if (allNewAnswers.isEmpty()) return;

        List<AnswerCreationDTO> validAnswersToSave = new ArrayList<>();

        for (AnswerCreationDTO dto : allNewAnswers) {
            UUID docId = dto.getDocumentNode().getId();

            // check if document node exists
            if (!taskNodeRepository.existsById(docId)) {
                logger.error("❌ CRITICAL ERROR: Document Node {} is MISSING from DB! Skipping save for its answers.", docId);
                continue;
            }
            validAnswersToSave.add(dto);
        }

        if (!validAnswersToSave.isEmpty()) {
            taskEdgeService.createAnswerNodesAndEdges(validAnswersToSave);
        }
    }
}

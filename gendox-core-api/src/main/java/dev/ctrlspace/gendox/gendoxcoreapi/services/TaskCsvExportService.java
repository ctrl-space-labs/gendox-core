package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskCsvExportService {
    Logger logger = LoggerFactory.getLogger(TaskCsvExportService.class);

    private final TaskNodeService taskNodeService;
    private final DocumentService documentService;
    private final DocumentOnlyConverter documentOnlyConverter;

    @Autowired
    public TaskCsvExportService(TaskNodeService taskNodeService , DocumentService documentService, DocumentOnlyConverter documentOnlyConverter) {
        this.taskNodeService = taskNodeService;
        this.documentService = documentService;
        this.documentOnlyConverter = documentOnlyConverter;
    }

    public InputStreamResource exportTaskCsv(UUID taskId) throws GendoxException {
        // Fetch nodes
        Page<TaskNode> documentNodes = taskNodeService.getTaskNodesByType(taskId, TaskNodeTypeConstants.DOCUMENT);
        Page<TaskNode> questionNodes = taskNodeService.getTaskNodesByType(taskId, TaskNodeTypeConstants.QUESTION);
        Page<TaskNode> answerNodes = taskNodeService.getTaskNodesByType(taskId, TaskNodeTypeConstants.ANSWER);

        logger.info(
                "Exporting task CSV: taskId={}, documents={} ({} pages), questions={} ({} pages), answers={} ({} pages)",
                taskId,
                documentNodes.getTotalElements(), documentNodes.getTotalPages(),
                questionNodes.getTotalElements(), questionNodes.getTotalPages(),
                answerNodes.getTotalElements(), answerNodes.getTotalPages()
        );

        // Build helpers
        Map<UUID, String> docIdToTitle = getDocumentTitles(documentNodes);
        Map<String, TaskNodeValueDTO> answerMatrix = buildAnswerMatrix(answerNodes);

        // Write CSV
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);

        try {
            writeHeaderRows(writer, questionNodes);
            writeDataRows(writer, documentNodes, questionNodes, docIdToTitle, answerMatrix);
            writer.flush();
            return new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }
    }

// --- Helper methods below ---

    private Map<UUID, String> getDocumentTitles(Page<TaskNode> documentNodes) throws GendoxException {
        List<UUID> documentNodeIds = documentNodes.stream()
                .map(TaskNode::getDocumentId)
                .filter(Objects::nonNull)
                .toList();

        DocumentCriteria criteria = new DocumentCriteria();
        criteria.setDocumentInstanceIds(documentNodeIds.stream().map(UUID::toString).toList());
        Page<DocumentInstanceDTO> docsPage = documentService.getAllDocuments(criteria, Pageable.unpaged())
                .map(documentOnlyConverter::toDTO);
        List<DocumentInstanceDTO> documentDTOs = docsPage.getContent();

        return documentDTOs.stream()
                .collect(Collectors.toMap(
                        DocumentInstanceDTO::getId,
                        DocumentInstanceDTO::getTitle
                ));
    }

    private Map<String, TaskNodeValueDTO> buildAnswerMatrix(Page<TaskNode> answerNodes) {
        Map<String, TaskNodeValueDTO> answerMatrix = new HashMap<>();
        for (TaskNode answerNode : answerNodes) {
            TaskNodeValueDTO value = answerNode.getNodeValue();
            if (value != null && value.getNodeDocumentId() != null && value.getNodeQuestionId() != null) {
                String key = value.getNodeDocumentId() + "|" + value.getNodeQuestionId();
                answerMatrix.put(key, value);
            }
        }
        return answerMatrix;
    }

    private void writeHeaderRows(OutputStreamWriter writer, Page<TaskNode> questionNodes) throws Exception {
        // First row: question texts (each 3 times)
        writer.write("Document/Question");
        for (TaskNode question : questionNodes) {
            String qTitle = question.getNodeValue() != null && question.getNodeValue().getMessage() != null
                    ? question.getNodeValue().getMessage().replaceAll("[\r\n]+", " ")
                    : question.getId().toString();
            writer.write("," + escapeCsv(qTitle));
            writer.write(",");
            writer.write(",");
        }
        writer.write("\n");

        // Second row: sub-headers
        writer.write("");
        for (int i = 0; i < questionNodes.getContent().size(); i++) {
            writer.write(",Answer,Flag,Message");
        }
        writer.write("\n");
    }

    private void writeDataRows(
            OutputStreamWriter writer,
            Page<TaskNode> documentNodes,
            Page<TaskNode> questionNodes,
            Map<UUID, String> docIdToTitle,
            Map<String, TaskNodeValueDTO> answerMatrix
    ) throws Exception {
        for (TaskNode document : documentNodes) {
            String docTitle = docIdToTitle.getOrDefault(document.getDocumentId(), document.getId().toString());
            writer.write(escapeCsv(docTitle));
            for (TaskNode question : questionNodes) {
                String key = document.getId() + "|" + question.getId();
                TaskNodeValueDTO value = answerMatrix.get(key);
                String answerValue = value != null && value.getAnswerValue() != null ? value.getAnswerValue() : "";
                String flagEnum = value != null && value.getAnswerFlagEnum() != null ? value.getAnswerFlagEnum().toString() : "";
                String message = value != null && value.getMessage() != null ? value.getMessage() : "";

                writer.write("," + escapeCsv(answerValue));
                writer.write("," + escapeCsv(flagEnum));
                writer.write("," + escapeCsv(message));
            }
            writer.write("\n");
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        boolean mustQuote = value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r");
        if (mustQuote) {
            value = value.replace("\"", "\"\"");
            return "\"" + value + "\"";
        }
        return value;
    }

}

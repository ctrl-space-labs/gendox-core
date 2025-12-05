package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
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

    public InputStreamResource documentInsightExportCSV(UUID taskId) throws GendoxException {
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

    public InputStreamResource documentInsightExportSingleDocumentCSV(UUID taskId, UUID documentNodeId) throws GendoxException {
        logger.info("Exporting single document insight CSV: taskId={}, documentNodeId={}", taskId, documentNodeId);

        TaskNode documentNode = taskNodeService.getTaskNodeById(documentNodeId);
        if (documentNode == null || !documentNode.getTaskId().equals(taskId)) {
            throw new GendoxException("DOCUMENT_NODE_NOT_FOUND", "Document node not found for task", HttpStatus.NOT_FOUND);
        }

        // Load questions
        Page<TaskNode> questionNodes = taskNodeService.getTaskNodesByType(taskId, TaskNodeTypeConstants.QUESTION);

        // Load answers only for this document
        TaskNodeCriteria criteria = TaskNodeCriteria.builder()
                .taskId(taskId)
                .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER))
                .nodeValueNodeDocumentId(documentNodeId)
                .build();
        Page<TaskNode> answerNodes = taskNodeService.getTaskNodesByCriteria(criteria, Pageable.unpaged());

        Map<String, TaskNodeValueDTO> answerMatrix = buildAnswerMatrix(answerNodes);

        // Optional: Load document title
        Map<UUID, String> docTitles = getDocumentTitles(new PageImpl<>(List.of(documentNode)));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);

        try {
            // header: questions only
            writer.write("Document");
            for (TaskNode question : questionNodes) {
                writer.write("," + escapeCsv(question.getNodeValue().getMessage()));
            }
            writer.write("\n");

            String docTitle = docTitles.getOrDefault(documentNode.getDocumentId(), documentNodeId.toString());
            writer.write(escapeCsv(docTitle));

            // answers row
            for (TaskNode q : questionNodes) {
                String key = documentNodeId + "|" + q.getId();
                TaskNodeValueDTO val = answerMatrix.get(key);
                writer.write("," + escapeCsv(val != null ? val.getAnswerValue() : ""));
            }

            writer.write("\n");
            writer.flush();

            return new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to export single document CSV", e);
        }
    }



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

    public InputStreamResource documentDigitizationExportCSV(UUID taskId, UUID documentNodeId) throws GendoxException {
        logger.info("Exporting document digitization CSV: taskId={}, documentNodeId={}", taskId, documentNodeId);

        // Get the document node and its info
        TaskNode documentNode = taskNodeService.getTaskNodeById(documentNodeId);
        if (documentNode == null || !documentNode.getTaskId().equals(taskId)) {
            throw new GendoxException("DOCUMENT_NODE_NOT_FOUND", "Document node not found for task", org.springframework.http.HttpStatus.NOT_FOUND);
        }

        // Get document info
        DocumentInstanceDTO document = null;
        if (documentNode.getDocumentId() != null) {
            DocumentCriteria criteria = new DocumentCriteria();
            criteria.setDocumentInstanceIds(List.of(documentNode.getDocumentId().toString()));
            Page<DocumentInstanceDTO> docsPage = documentService.getAllDocuments(criteria, Pageable.unpaged())
                    .map(documentOnlyConverter::toDTO);
            if (!docsPage.getContent().isEmpty()) {
                document = docsPage.getContent().get(0);
            }
        }

        // Get answer nodes for this document
        TaskNodeCriteria answerCriteria = TaskNodeCriteria.builder()
                .taskId(taskId)
                .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER))
                .nodeValueNodeDocumentId(documentNodeId)
                .build();
        Page<TaskNode> answerNodes = taskNodeService.getTaskNodesByCriteria(answerCriteria, Pageable.unpaged());

        // Group answers by page number and sort
        Map<Integer, TaskNode> pageAnswerMap = answerNodes.getContent().stream()
                .filter(node -> node.getNodeValue() != null && node.getNodeValue().getOrder() != null)
                .collect(Collectors.toMap(
                        node -> node.getNodeValue().getOrder(),
                        node -> node,
                        (existing, replacement) -> existing // Keep first if duplicates
                ));

        // Write CSV
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);

        try {
            writeDocumentDigitizationCsv(writer, document, documentNode, pageAnswerMap);
            writer.flush();
            return new InputStreamResource(new ByteArrayInputStream(out.toByteArray()));
        } catch (Exception e) {
            throw new RuntimeException("Failed to export document digitization CSV", e);
        }
    }

    private void writeDocumentDigitizationCsv(
            OutputStreamWriter writer,
            DocumentInstanceDTO document,
            TaskNode documentNode,
            Map<Integer, TaskNode> pageAnswerMap
    ) throws Exception {
        // Header row
        writer.write("Document Title,Prompt,Structure");
        
        // Add page columns for all pages that have answers
        List<Integer> sortedPages = pageAnswerMap.keySet().stream()
                .sorted()
                .toList();
        
        for (Integer pageNum : sortedPages) {
            writer.write(",Page " + pageNum);
        }
        writer.write("\n");

        // Data row
        String documentTitle = document != null ? document.getTitle() : "Unknown Document";
        String prompt = documentNode.getNodeValue() != null && documentNode.getNodeValue().getDocumentMetadata().getPrompt() != null
                ? documentNode.getNodeValue().getDocumentMetadata().getPrompt() : "";
        String structure = documentNode.getNodeValue() != null && documentNode.getNodeValue().getDocumentMetadata().getStructure() != null
                ? documentNode.getNodeValue().getDocumentMetadata().getStructure() : "";

        writer.write(escapeCsv(documentTitle));
        writer.write("," + escapeCsv(prompt));
        writer.write("," + escapeCsv(structure));

        // Add page answer data
        for (Integer pageNum : sortedPages) {
            TaskNode answerNode = pageAnswerMap.get(pageNum);
            String answerContent = "";
            if (answerNode != null && answerNode.getNodeValue() != null && answerNode.getNodeValue().getMessage() != null) {
                answerContent = answerNode.getNodeValue().getMessage();
            }
            writer.write("," + escapeCsv(answerContent));
        }
        writer.write("\n");
    }

}

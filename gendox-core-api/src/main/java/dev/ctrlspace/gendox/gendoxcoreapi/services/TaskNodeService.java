package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DocumentNodeAnswerPagesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDocumentQuestionsDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskEdgeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskNodeService {
    Logger logger = LoggerFactory.getLogger(TaskNodeService.class);

    private final TaskNodeRepository taskNodeRepository;
    private final TaskEdgeRepository taskEdgeRepository;
    private final TypeService typeService;
    private final EntityManager entityManager;


    @Autowired
    public TaskNodeService(TaskNodeRepository taskNodeRepository,
                           TaskEdgeRepository taskEdgeRepository,
                           TypeService typeService,
                           EntityManager entityManager) {
        this.taskNodeRepository = taskNodeRepository;
        this.taskEdgeRepository = taskEdgeRepository;
        this.typeService = typeService;
        this.entityManager = entityManager;
    }


    public TaskNode createTaskNode(TaskNode taskNode) throws GendoxException {
        logger.info("Creating new task node: {}", taskNode);
        if (taskNode.getNodeType().equals(typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.QUESTION))) {
            Integer maxOrder = findMaxOrderByTaskId(taskNode.getTaskId());
            int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;
            taskNode.getNodeValue().setOrder(nextOrder);
        }
        return taskNodeRepository.save(taskNode);
    }

    @Transactional
    public List<TaskNode> createTaskNodesBatch(List<TaskNode> taskNodes) throws GendoxException {
        if (taskNodes == null || taskNodes.isEmpty()) return Collections.emptyList();

        // All nodes must belong to the same task
        UUID taskId = taskNodes.get(0).getTaskId();
        // Find the current max order ONCE
        Integer maxOrder = findMaxOrderByTaskId(taskId);
        int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;

        for (TaskNode node : taskNodes) {
            if (node.getNodeType().equals(typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.QUESTION))) {
                node.getNodeValue().setOrder(nextOrder++);
            }
        }
        return taskNodeRepository.saveAll(taskNodes);
    }

    public TaskNode updateTaskNode(TaskNode taskNode) throws GendoxException {
        logger.info("Updating task node: {}", taskNode);

        // 1. Fetch existing from DB
        TaskNode existing = taskNodeRepository.findById(taskNode.getId())
                .orElseThrow(() -> new RuntimeException("TaskNode not found for update"));

        existing.setNodeValue(taskNode.getNodeValue());
        existing.setNodeType(taskNode.getNodeType());
        existing.setParentNodeId(taskNode.getParentNodeId());
        existing.setDocumentId(taskNode.getDocumentId());
        existing.setUpdatedBy(taskNode.getUpdatedBy());

        return taskNodeRepository.save(existing);
    }

    public TaskNode updateTaskNodeForDocumentDigitization(TaskDocumentMetadataDTO taskDocumentMetadataDTO) throws GendoxException {
        logger.info("Updating task node for document digitization: {}", taskDocumentMetadataDTO);

        TaskNode existing = taskNodeRepository.findById(taskDocumentMetadataDTO.getTaskNodeId())
                .orElseThrow(() -> new RuntimeException("TaskNode not found for update"));

        if (existing.getNodeValue() == null) {
            existing.setNodeValue(new TaskNodeValueDTO());
        }
        if (existing.getNodeValue().getDocumentMetadata() == null) {
            existing.getNodeValue().setDocumentMetadata(new TaskDocumentMetadataDTO());
        }

        if (taskDocumentMetadataDTO.getPrompt() != null) {
            existing.getNodeValue().getDocumentMetadata().setPrompt(taskDocumentMetadataDTO.getPrompt());
        }
        if (taskDocumentMetadataDTO.getStructure() != null) {
            existing.getNodeValue().getDocumentMetadata().setStructure(taskDocumentMetadataDTO.getStructure());
        }

        return taskNodeRepository.save(existing);
    }

    public TaskNode getTaskNodeById(UUID taskNodeId) {
        logger.info("Fetching task node by ID: {}", taskNodeId);
        return taskNodeRepository.findById(taskNodeId)
                .orElseThrow(() -> new RuntimeException("Task node not found"));
    }

    public Page<TaskNode> getTaskNodesByTaskId(UUID taskId, Pageable pageable) {
        logger.info("Fetching task nodes for task: {}", taskId);
        return taskNodeRepository.findAllByTaskId(taskId, pageable);
    }

    public Page<TaskNode> getTaskNodesByCriteria(TaskNodeCriteria criteria, Pageable pageable) {
        logger.info("Fetching task nodes by criteria: {}", criteria);
        return taskNodeRepository.findAll(TaskNodePredicates.build(criteria), pageable);
    }

    public Page<DocumentNodeAnswerPagesDTO> getDocumentNodeAnswerPages(UUID taskId, Pageable pageable) {
        Type documentNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.DOCUMENT);
        Type answerNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.ANSWER);

        List<Object[]> rawRows = taskNodeRepository.findDocumentNodeAnswerPagesByTaskId(
                taskId,
                documentNodeType.getId(),
                answerNodeType.getId()
        );

        List<DocumentNodeAnswerPagesDTO> results = rawRows.stream().map(row ->
                DocumentNodeAnswerPagesDTO.builder()
                        .taskDocumentNodeId((UUID) row[0])
                        .documentPages(row[1] == null ? null : ((Number) row[1]).intValue())
                        .numberOfNodePages(row[2] == null ? 0 : ((Number) row[2]).intValue())
                        .maxNodePage(row[3] == null ? 0 : ((Number) row[3]).intValue())
                        .build()
        ).toList();

        // Pagination manually
        int total = results.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<DocumentNodeAnswerPagesDTO> pageList = start < end ? results.subList(start, end) : Collections.emptyList();

        return new PageImpl<>(pageList, pageable, total);
    }

    public Optional<TaskNode> findAnswerNodeByDocumentAndQuestionOptional(UUID taskId, UUID documentNodeId, UUID questionNodeId) {
        logger.info("Fetching answer node for task: {}, document: {}, question: {}", taskId, documentNodeId, questionNodeId);
        return taskNodeRepository.findAnswerNodeByDocumentAndQuestion(taskId, documentNodeId, questionNodeId);
    }

    public Page<TaskNode> findAnswerNodesBatch(UUID taskId,
                                               List<UUID> documentNodeIds,
                                               List<UUID> questionNodeIds,
                                               Pageable pageable) {
        return taskNodeRepository
                .findAnswerNodesByDocumentIdsAndQuestionIds(taskId, documentNodeIds, questionNodeIds, pageable);
    }


    public Page<TaskNode> getTaskNodesByType(UUID taskId, String nodeTypeName) {
        TaskNodeCriteria criteria = new TaskNodeCriteria();
        criteria.setTaskId(taskId);
        criteria.setNodeTypeNames(Collections.singletonList(nodeTypeName));
        return getTaskNodesByCriteria(criteria, Pageable.unpaged());
    }

    public void deleteTaskNodesByIds(List<UUID> taskNodeIds) {
        if (taskNodeIds == null || taskNodeIds.isEmpty()) {
            return;
        }
        List<TaskNode> nodesToDelete = taskNodeRepository.findAllById(taskNodeIds);
        taskNodeRepository.deleteAll(nodesToDelete);
    }

    public void deleteDocumentNodeAndConnectionNodesByDocumentId(UUID documentId) throws GendoxException {
        logger.info("Deleting document node and its connection nodes for document: {}", documentId);

        // Fetch all task nodes that are of type DOCUMENT and have the given documentId
        List<TaskNode> documentNodes = taskNodeRepository.findAllByDocumentIdAndNodeTypeName(documentId, TaskNodeTypeConstants.DOCUMENT);
        if (documentNodes == null || documentNodes.isEmpty()) {
            return;
        }

        for (TaskNode documentNode : documentNodes) {
            // Delete the document node and its connected edges
            deleteTaskNodeAndConnectionNodes(documentNode.getId());
        }
    }

    @Transactional
    public void deleteTaskNodeAndConnectionNodes(UUID taskNodeId) throws GendoxException {
        logger.info("Deleting task node and its connection nodes: {}", taskNodeId);

        // Fetch the node to delete
        TaskNode nodeToDelete = taskNodeRepository.findById(taskNodeId)
                .orElseThrow(() -> new GendoxException("TASK_NODE_NOT_FOUND", "Task node not found for deletion", HttpStatus.NOT_FOUND));

        // Find all edges connected to this node
        List<TaskEdge> edgesToDeleteTo = taskEdgeRepository.findAllByToNodeIdIn(List.of(nodeToDelete.getId()));

        List<UUID> fromNodeIds = edgesToDeleteTo.stream()
                .map(edge -> edge.getFromNode().getId())
                .toList();

        List<TaskEdge> edgesToDeleteFrom = taskEdgeRepository.findAllByFromNodeIdIn(fromNodeIds);

        Set<UUID> allEdgeIdsToDelete = new HashSet<>();
        allEdgeIdsToDelete.addAll(edgesToDeleteTo.stream().map(TaskEdge::getId).toList());
        allEdgeIdsToDelete.addAll(edgesToDeleteFrom.stream().map(TaskEdge::getId).toList());

        if (!allEdgeIdsToDelete.isEmpty()) {
            taskEdgeRepository.deleteAllByIds(new ArrayList<>(allEdgeIdsToDelete));
            entityManager.clear();
        }

        if (!fromNodeIds.isEmpty()) {
            taskNodeRepository.deleteAllByIds(new ArrayList<>(fromNodeIds));
            entityManager.clear();
        }

        // Now delete the node itself
        taskNodeRepository.delete(nodeToDelete);
    }

    /**
     * Returns the current maximum 'order' value among task nodes of a given taskId.
     * Assumes 'order' is stored inside TaskNode.nodeValue (JSON).
     */
    public Integer findMaxOrderByTaskId(UUID taskId) {
        return taskNodeRepository.findMaxOrderByTaskId(taskId);
    }

    public Page<TaskDocumentQuestionsDTO> getDocumentsGroupedWithQuestions(TaskNodeCriteria criteria, Pageable pageable) {
        Type documentNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.DOCUMENT);
        Type questionNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.QUESTION);

        List<UUID> documentNodeIdsFilter = criteria.getDocumentNodeIds();
        if (documentNodeIdsFilter != null && documentNodeIdsFilter.isEmpty()) {
            documentNodeIdsFilter = null; // treat empty as null for query
        }

        List<UUID> questionNodeIdsFilter = criteria.getQuestionNodeIds();
        if (questionNodeIdsFilter != null && questionNodeIdsFilter.isEmpty()) {
            questionNodeIdsFilter = null;
        }

        TaskNodeCriteria documentsCriteria = TaskNodeCriteria.builder()
                .taskId(criteria.getTaskId())
                .nodeTypeNames(List.of(TaskNodeTypeConstants.DOCUMENT))
                .nodeIds(documentNodeIdsFilter)
                .build();

        Page<TaskNode> documents = taskNodeRepository.findAll(TaskNodePredicates.build(documentsCriteria), pageable);


        TaskNodeCriteria questionsCriteria = TaskNodeCriteria.builder()
                .taskId(criteria.getTaskId())
                .nodeTypeNames(List.of(TaskNodeTypeConstants.QUESTION))
                .nodeIds(questionNodeIdsFilter)
                .build();

        // bring all questions for the task
        Page<TaskNode> questions = taskNodeRepository.findAll(TaskNodePredicates.build(questionsCriteria), Pageable.unpaged());


        List<Object[]> documentQuestionPairs = taskNodeRepository.findDocumentQuestionPairsByCriteria(
                criteria.getTaskId(),
                documentNodeType.getId(),
                questionNodeType.getId(),
                documentNodeIdsFilter,
                questionNodeIdsFilter,
                pageable);

        List<TaskDocumentQuestionsDTO> documentsGroupedWithQuestions = documents.stream()
                .map(docNode -> TaskDocumentQuestionsDTO.builder()
                        .taskId(criteria.getTaskId())
                        .documentNode(docNode)
                        .questionNodes(new ArrayList<>(questions.getContent()))
                        .build())
                .collect(Collectors.toList());


        Page<TaskDocumentQuestionsDTO> documentsPage = new PageImpl<>(documentsGroupedWithQuestions, pageable, documents.getTotalElements());


        return documentsPage;
    }

    public Page<TaskDocumentMetadataDTO> getTaskDocumentMetadataByCriteria(TaskNodeCriteria criteria, Pageable pageable) {
        logger.info("Fetching task document metadata by criteria: {}", criteria);

        Page<TaskNode> nodesPage = taskNodeRepository.findAll(TaskNodePredicates.build(criteria), pageable);

        List<TaskDocumentMetadataDTO> metadataList = nodesPage.stream()
                .map(node -> {
                    TaskDocumentMetadataDTO.TaskDocumentMetadataDTOBuilder builder = TaskDocumentMetadataDTO.builder()
                            .taskNodeId(node.getId());
                    if (node.getNodeValue() != null) {
                        if (node.getNodeValue().getDocumentMetadata() != null) {
                            builder.prompt(node.getNodeValue().getDocumentMetadata().getPrompt());       // might be null, that's fine
                            builder.structure(node.getNodeValue().getDocumentMetadata().getStructure()); // might be null, that's fine
                        }
                    }
                    return builder.build();
                })
                .collect(Collectors.toList());

        return new PageImpl<>(metadataList, pageable, nodesPage.getTotalElements());
    }


}

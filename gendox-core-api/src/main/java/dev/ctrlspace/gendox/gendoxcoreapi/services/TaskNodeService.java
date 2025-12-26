package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskEdgeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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
    private final DocumentService documentService;


    @Autowired
    public TaskNodeService(TaskNodeRepository taskNodeRepository,
                           TaskEdgeRepository taskEdgeRepository,
                           TypeService typeService,
                           EntityManager entityManager,
                           @Lazy DocumentService documentService) {
        this.taskNodeRepository = taskNodeRepository;
        this.taskEdgeRepository = taskEdgeRepository;
        this.typeService = typeService;
        this.entityManager = entityManager;
        this.documentService = documentService;
    }


    public TaskNode createTaskNode(TaskNode taskNode) throws GendoxException {
        logger.info("Creating new task node: {}", taskNode);
        if (taskNode.getNodeType().equals(typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.QUESTION))) {
            Integer maxOrder = findMaxOrderByTaskId(taskNode.getTaskId());
            int nextOrder = (maxOrder != null ? maxOrder : 0) + 1;
            taskNode.getNodeValue().setOrder(nextOrder);
        }
        return taskNodeRepository.saveAndFlush(taskNode);
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

    public TaskNode updateTaskNode(TaskNodeDTO taskNodeDTO, Task task) throws GendoxException {
        TaskNode existing = taskNodeRepository.findById(taskNodeDTO.getId())
                .orElseThrow(() -> new GendoxException("TASK_NODE_NOT_FOUND", "Node not found", HttpStatus.NOT_FOUND));
        logger.info("Updating task node: {} with data: {}", existing.getId(), taskNodeDTO);

        // ---- LEVEL 1: Primitive attributes -----
        if (taskNodeDTO.getParentNodeId() != null) {
            existing.setParentNodeId(taskNodeDTO.getParentNodeId());
        }
        if (taskNodeDTO.getDocumentId() != null) {
            existing.setDocumentId(taskNodeDTO.getDocumentId());
        }
        if (taskNodeDTO.getNodeType() != null) {
            existing.setNodeType(typeService.getTaskNodeTypeByName(taskNodeDTO.getNodeType()));
        }
        if (taskNodeDTO.getUserId() != null) {
            existing.setUpdatedBy(taskNodeDTO.getUserId());
        }

        // ---- LEVEL 2: NodeValue (nested DTO) -----
        if (taskNodeDTO.getNodeValue() != null) {
            if (existing.getNodeValue() == null) {
                existing.setNodeValue(new TaskNodeValueDTO());
            }

            TaskNodeValueDTO incomingValue = taskNodeDTO.getNodeValue();
            TaskNodeValueDTO currentValue = existing.getNodeValue();

            if (incomingValue.getMessage() != null) {
                currentValue.setMessage(incomingValue.getMessage());
            }
            if (incomingValue.getAnswerValue() != null) currentValue.setAnswerValue(incomingValue.getAnswerValue());
            if (incomingValue.getAnswerFlagEnum() != null)
                currentValue.setAnswerFlagEnum(incomingValue.getAnswerFlagEnum());
            if (incomingValue.getQuestionTitle() != null)
                currentValue.setQuestionTitle(incomingValue.getQuestionTitle());
            if (incomingValue.getOrder() != null) currentValue.setOrder(incomingValue.getOrder());


            // ---- LEVEL 3: Metadata -----
            if (incomingValue.getDocumentMetadata() != null) {

                if (currentValue.getDocumentMetadata() == null) {
                    currentValue.setDocumentMetadata(new TaskDocumentMetadataDTO());
                }

                TaskDocumentMetadataDTO incMeta = incomingValue.getDocumentMetadata();
                TaskDocumentMetadataDTO curMeta = currentValue.getDocumentMetadata();

                if (incMeta.getPrompt() != null) {
                    curMeta.setPrompt(incMeta.getPrompt());
                }
                if (incMeta.getStructure() != null) {
                    curMeta.setStructure(incMeta.getStructure());
                }
                if (incMeta.getSupportingDocumentIds() != null) {
                    curMeta.setSupportingDocumentIds(incMeta.getSupportingDocumentIds());
                }
                if (incMeta.getInsightsSummary() != null) {
                    curMeta.setInsightsSummary(incMeta.getInsightsSummary());
                }

                // allPages / page range
                Boolean allPages = incMeta.getAllPages();
                Integer from = incMeta.getPageFrom();
                Integer to = incMeta.getPageTo();

                if (Boolean.TRUE.equals(allPages)) {
                    curMeta.setAllPages(true);
                    curMeta.setPageFrom(null);
                    curMeta.setPageTo(null);
                } else {
                    boolean hasRangeUpdate = (from != null) || (to != null);

                    if (from != null) {
                        curMeta.setPageFrom(from);
                    }
                    if (to != null) {
                        curMeta.setPageTo(to);
                    }

                    if (allPages != null) {
                        curMeta.setAllPages(allPages);
                    } else if (hasRangeUpdate) {
                        curMeta.setAllPages(false);
                    }

                }
            }
        }

        // check for Answer nodes to delete if document insights task questions or documents changed
        if (TaskTypeConstants.DOCUMENT_INSIGHTS.equalsIgnoreCase(task.getTaskType().getName())) {
            deleteRelatedAnswerNodes(existing, taskNodeDTO);
        }

        return taskNodeRepository.save(existing);
    }


    public TaskNode updateTaskNodesMetadata(TaskDocumentMetadataDTO taskDocumentMetadataDTO) throws GendoxException {
        logger.debug("Updating task node for document digitization: {}", taskDocumentMetadataDTO);

        TaskNode existing = taskNodeRepository.findById(taskDocumentMetadataDTO.getTaskNodeId())
                .orElseThrow(() -> new GendoxException("TASK_NODE_NOT_FOUND", "TaskNode not found for update", HttpStatus.NOT_FOUND));

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
        if (taskDocumentMetadataDTO.getSupportingDocumentIds() != null) {
            existing.getNodeValue().getDocumentMetadata().setSupportingDocumentIds(taskDocumentMetadataDTO.getSupportingDocumentIds());
        }
        if (taskDocumentMetadataDTO.getInsightsSummary() != null) {
            existing.getNodeValue().getDocumentMetadata().setInsightsSummary(taskDocumentMetadataDTO.getInsightsSummary());
        }

        // allPages / page range
        Boolean allPages = taskDocumentMetadataDTO.getAllPages();
        Integer from = taskDocumentMetadataDTO.getPageFrom();
        Integer to = taskDocumentMetadataDTO.getPageTo();

        if (Boolean.TRUE.equals(allPages)) {
            existing.getNodeValue().getDocumentMetadata().setAllPages(true);
            existing.getNodeValue().getDocumentMetadata().setPageFrom(null);
            existing.getNodeValue().getDocumentMetadata().setPageTo(null);
        } else {
            boolean hasRangeUpdate = (from != null) || (to != null);

            if (from != null) {
                existing.getNodeValue().getDocumentMetadata().setPageFrom(from);
            }
            if (to != null) {
                existing.getNodeValue().getDocumentMetadata().setPageTo(to);
            }

            if (allPages != null) {
                existing.getNodeValue().getDocumentMetadata().setAllPages(allPages);
            } else if (hasRangeUpdate) {
                existing.getNodeValue().getDocumentMetadata().setAllPages(false);
            }
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
        taskNodeRepository.deleteAllByIds(taskNodeIds);
    }

    public void deleteAnswerTaskNodes(Page<TaskNode> taskNodes) {
        List<UUID> nodeIdsToDelete = taskNodes.stream()
                .map(TaskNode::getId)
                .toList();
        deleteAnswersConnectionEdges(nodeIdsToDelete);
        deleteTaskNodesByIds(nodeIdsToDelete);
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
    public void deleteTaskNodeAndConnectionNodes(UUID taskNodeId) {
        logger.info("Deleting task node and its connection nodes: {}", taskNodeId);

        // Find all edges connected to this node
        List<TaskEdge> edgesToDeleteTo = taskEdgeRepository.findAllByToNodeIdIn(List.of(taskNodeId));

        List<UUID> fromNodeIds = edgesToDeleteTo.stream()
                .map(edge -> edge.getFromNode().getId())
                .toList();

        List<UUID> edgeIDsToDeleteFrom = taskEdgeRepository.findAllIdsByFromNodeIdIn(fromNodeIds);

        Set<UUID> allEdgeIdsToDelete = new HashSet<>();
        allEdgeIdsToDelete.addAll(edgesToDeleteTo.stream().map(TaskEdge::getId).toList());
        allEdgeIdsToDelete.addAll(edgeIDsToDeleteFrom);

        if (!allEdgeIdsToDelete.isEmpty()) {
            taskEdgeRepository.deleteAllByIds(new ArrayList<>(allEdgeIdsToDelete));
            entityManager.clear();
        }

        if (!fromNodeIds.isEmpty()) {
            taskNodeRepository.deleteAllByIds(new ArrayList<>(fromNodeIds));
            entityManager.clear();
        }

        // Now delete the node itself
        taskNodeRepository.deleteById(taskNodeId);
    }

    @Transactional
    public void deleteAnswersConnectionEdges(List<UUID> taskNodeIds) {
        logger.info("Deleting task nodes' answer connection edges: {}", taskNodeIds);

        // Find all edges connected to this node
        List<UUID> edgesToDeleteTo = taskEdgeRepository.findAllIdsByToNodeIdIn(taskNodeIds);
        List<UUID> edgeToDeleteFrom = taskEdgeRepository.findAllIdsByFromNodeIdIn(taskNodeIds);

        Set<UUID> allEdgeIdsToDelete = new HashSet<>();
        allEdgeIdsToDelete.addAll(edgesToDeleteTo);
        allEdgeIdsToDelete.addAll(edgeToDeleteFrom);

        if (!allEdgeIdsToDelete.isEmpty()) {
            taskEdgeRepository.deleteAllByIds(new ArrayList<>(allEdgeIdsToDelete));
            entityManager.clear();
        }
    }

    private void deleteRelatedAnswerNodes(TaskNode existing, TaskNodeDTO taskNodeDTO) {
        if (taskNodeDTO.getNodeValue() == null) {
            return;
        }
        TaskNodeValueDTO incomingValue = taskNodeDTO.getNodeValue();
        TaskDocumentMetadataDTO incomingMetadata = incomingValue.getDocumentMetadata();


        TaskNodeCriteria.TaskNodeCriteriaBuilder criteriaBuilder = TaskNodeCriteria.builder()
                .taskId(existing.getTaskId())
                .nodeTypeNames(List.of(TaskNodeTypeConstants.ANSWER));

        boolean shouldSearch = false;

        // Check for QUESTION node changes
        if (TaskNodeTypeConstants.QUESTION.equals(existing.getNodeType().getName())) {
            boolean messageChanged = incomingValue.getMessage() != null;
            boolean supportingDocsChanged = incomingMetadata.getSupportingDocumentIds() != null;

            if (messageChanged || supportingDocsChanged) {
                criteriaBuilder.questionNodeIds(List.of(existing.getId()));
                shouldSearch = true;
            }
        }

        // Check for DOCUMENT node changes
        if (TaskNodeTypeConstants.DOCUMENT.equals(existing.getNodeType().getName())) {
            boolean supportingDocsChanged = incomingMetadata.getSupportingDocumentIds() != null;
            boolean promptChanged = incomingMetadata.getPrompt() != null;

            if (supportingDocsChanged || promptChanged) {
                criteriaBuilder.documentNodeIds(List.of(existing.getId()));
                shouldSearch = true;
            }
        }

        if (!shouldSearch) {
            return;
        }

        TaskNodeCriteria criteria = criteriaBuilder.build();
        Page<TaskNode> answerNodes = getTaskNodesByCriteria(criteria, Pageable.unpaged());

        if (!answerNodes.isEmpty()) {
            logger.info("Deleting {} answer nodes linked to updated node {}",
                    answerNodes.getTotalElements(), existing.getId());
            deleteAnswerTaskNodes(answerNodes);
        }
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

    public Page<TaskDocumentMetadataDTO> getTaskDocumentMetadataByCriteria(TaskNodeCriteria criteria, Pageable pageable) throws GendoxException {
        logger.info("Fetching task document metadata by criteria: {}", criteria);

        Page<TaskNode> nodesPage = taskNodeRepository.findAll(TaskNodePredicates.build(criteria), pageable);
        Map<UUID, DocumentInstance> documentsById = getDocumentsById(nodesPage);

        List<TaskDocumentMetadataDTO> metadataList = nodesPage.stream()
                .map(node -> {
                    TaskDocumentMetadataDTO.TaskDocumentMetadataDTOBuilder builder = TaskDocumentMetadataDTO.builder()
                            .taskNodeId(node.getId())
                            .taskNode(node)
                            .documentInstance(documentsById.get(node.getDocumentId()));

                    if (node.getNodeValue() != null) {
                        if (node.getNodeValue().getDocumentMetadata() != null) {
                            builder.prompt(node.getNodeValue().getDocumentMetadata().getPrompt());
                            builder.structure(node.getNodeValue().getDocumentMetadata().getStructure());
                            builder.pageFrom(node.getNodeValue().getDocumentMetadata().getPageFrom());
                            builder.pageTo(node.getNodeValue().getDocumentMetadata().getPageTo());
                            builder.allPages(node.getNodeValue().getDocumentMetadata().getAllPages());
                        }
                    }
                    return builder.build();
                })
                .collect(Collectors.toList());

        return new PageImpl<>(metadataList, pageable, nodesPage.getTotalElements());
    }

    private Map<UUID, DocumentInstance> getDocumentsById(Page<TaskNode> nodesPage) throws GendoxException {
        List<UUID> documentIdsInvolved = nodesPage.stream()
                .map(TaskNode::getDocumentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        DocumentCriteria documentCriteria = DocumentCriteria.builder()
                .documentInstanceIds(documentIdsInvolved.stream().map(UUID::toString).collect(Collectors.toList()))
                .build();
        Map<UUID, DocumentInstance> documentsById = documentService.getAllDocuments(documentCriteria, Pageable.unpaged())
                .stream()
                .collect(Collectors.toMap(DocumentInstance::getId, doc -> doc));

        return documentsById;
    }


}

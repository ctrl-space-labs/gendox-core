package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskEdgePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeRelationshipTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;

@Service
public class TaskService {
    Logger logger = LoggerFactory.getLogger(TaskService.class);
    private final TaskRepository taskRepository;
    private final TaskNodeRepository taskNodeRepository;
    private final TaskEdgeRepository taskEdgeRepository;
    private final TypeService typeService;


    @Autowired
    public TaskService(TaskRepository taskRepository,
                       TaskNodeRepository taskNodeRepository,
                       TaskEdgeRepository taskEdgeRepository,
                       TypeService typeService) {
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.taskEdgeRepository = taskEdgeRepository;
        this.typeService = typeService;
    }

    public Task createTask(UUID projectId, TaskDTO taskDTO) {
        Task task = new Task();
        task.setProjectId(projectId);
        task.setTaskType(typeService.getTaskTypeByName(taskDTO.getType()));
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        logger.info("Creating new task: {}", task);
        return taskRepository.save(task);
    }

    public List<Task> getAllTasksByProjectId(UUID projectId) {
        logger.info("Fetching all tasks for project: {}", projectId);
        return taskRepository.findAllByProjectId(projectId);
    }

    public Task getTaskById(UUID taskId) {
        logger.info("Fetching task by ID: {}", taskId);
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }


    public TaskNode createTaskNode(TaskNode taskNode) throws GendoxException {
        logger.info("Creating new task node: {}", taskNode);
        return taskNodeRepository.save(taskNode);
    }

    public TaskNode updateTaskNode(TaskNode taskNode) throws GendoxException {
        logger.info("Updating task node: {}", taskNode);

        // 1. Fetch existing from DB
        TaskNode existing = taskNodeRepository.findById(taskNode.getId())
                .orElseThrow(() -> new RuntimeException("TaskNode not found for update"));

        existing.setNodeValue(taskNode.getNodeValue());
        existing.setNodeType(taskNode.getNodeType());
        existing.setParentNodeId(taskNode.getParentNodeId());
        existing.setDocument(taskNode.getDocument());
        existing.setPageNumber(taskNode.getPageNumber());
        existing.setUpdatedBy(taskNode.getUpdatedBy());

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

    public TaskEdge createTaskEdge(TaskEdge taskEdge) {
        logger.info("Creating new task edge: {}", taskEdge);
        return taskEdgeRepository.save(taskEdge);
    }

    public TaskEdge getTaskEdgeById(UUID taskEdgeId) {
        logger.info("Fetching task edge by ID: {}", taskEdgeId);
        return taskEdgeRepository.findById(taskEdgeId)
                .orElseThrow(() -> new RuntimeException("Task edge not found"));
    }

    public Page<TaskEdge> getTaskEdgesByCriteria(TaskEdgeCriteria criteria, Pageable pageable) {
        logger.info("Fetching task edges by criteria: {}", criteria);
        return taskEdgeRepository.findAll(TaskEdgePredicates.build(criteria), pageable);
    }

    public TaskDocumentInsightsDTO getTaskDocumentInsights(Page<TaskNode> taskNodes, UUID taskId) {
        logger.info("Generating document insightsDTO for task: {}", taskId);
        TaskDocumentInsightsDTO insightsDTO = TaskDocumentInsightsDTO.builder()
                .taskId(taskId)
                .documentNodes(new ArrayList<>())
                .questionNodes(new ArrayList<>())
                .build();

        // Process each task node to extract insightsDTO
        for (TaskNode node : taskNodes) {
            if (node.getNodeType() == null || node.getNodeType().getName() == null) {
                continue; // skip nodes without type
            }
            String nodeTypeName = node.getNodeType().getName();

            if (TaskNodeTypeConstants.DOCUMENT.equalsIgnoreCase(nodeTypeName)) {
                insightsDTO.getDocumentNodes().add(node);
            } else if (TaskNodeTypeConstants.QUESTION.equalsIgnoreCase(nodeTypeName)) {
                insightsDTO.getQuestionNodes().add(node);
            }
        }

        return insightsDTO;
    }


    public List<TaskEdge> createAnswerEdges(List<TaskNode> savedNodes) throws GendoxException {

        Type answersRelationType = typeService.getTaskNodeRelationshipTypeByName(TaskNodeRelationshipTypeConstants.ANSWERS);
        if (answersRelationType == null) {
            throw new IllegalStateException("Relation type 'ANSWERS' not found");
        }

        List<TaskEdge> edgesToSave = new ArrayList<>();

        for (TaskNode savedNode : savedNodes) {
            if (savedNode.getNodeValue() != null) {
                UUID documentNodeId = UUID.fromString(savedNode.getNodeValue().getDocumentNodeId());
                UUID questionNodeId = UUID.fromString(savedNode.getNodeValue().getQuestionNodeId());

                TaskNode documentNode = taskNodeRepository.findById(documentNodeId)
                        .orElseThrow(() -> new GendoxException("DOCUMENT_NODE_NOT_FOUND", "Document node not found with ID: " + documentNodeId, HttpStatus.NOT_FOUND));
                TaskNode questionNode = taskNodeRepository.findById(questionNodeId)
                        .orElseThrow(() -> new GendoxException("QUESTION_NODE_NOT_FOUND", "Question node not found with ID: " + questionNodeId, HttpStatus.NOT_FOUND));

                TaskEdge edgeToDocument = new TaskEdge();
                edgeToDocument.setFromNode(savedNode);
                edgeToDocument.setToNode(documentNode);
                edgeToDocument.setRelationType(answersRelationType);
                edgesToSave.add(edgeToDocument);


                TaskEdge edgeToQuestion = new TaskEdge();
                edgeToQuestion.setFromNode(savedNode);
                edgeToQuestion.setToNode(questionNode);
                edgeToQuestion.setRelationType(answersRelationType);
                edgesToSave.add(edgeToQuestion);

            }
        }


        List<TaskEdge> savedEdges = taskEdgeRepository.saveAll(edgesToSave);
        logger.info("Saved {} task edges linking answer nodes to document and question nodes", savedEdges.size());
        return savedEdges;
    }



    public List<UUID> deleteAnswerEdgesByTaskDocumentInsights(TaskDocumentInsightsDTO taskDocumentInsightsDTO) {
        // 1. get the ANSWERS relation type
        Type answersRelationType = typeService.getTaskNodeRelationshipTypeByName(TaskNodeRelationshipTypeConstants.ANSWERS);
        if (answersRelationType == null) {
            throw new IllegalStateException("Relation type 'ANSWERS' not found");
        }

        // 2. create a list of toNodeIds from documentNodes and questionNodes
        List<UUID> toNodeIds = new ArrayList<>();
        for (TaskNode docNode : taskDocumentInsightsDTO.getDocumentNodes()) {
            toNodeIds.add(docNode.getId());
        }
        for (TaskNode quesNode : taskDocumentInsightsDTO.getQuestionNodes()) {
            toNodeIds.add(quesNode.getId());
        }

        // 3. found all edges with the ANSWERS relation type and toNodeIds
        List<TaskEdge> edgesToDelete = taskEdgeRepository.findAllByRelationTypeAndToNodeIdIn(answersRelationType, toNodeIds);

        // 4. take the fromNodeIds from the edges to delete
        List<UUID> fromNodeIds = edgesToDelete.stream()
                .map(edge -> edge.getFromNode().getId())
                .distinct()
                .toList();

        // 5. Delete the edges
        taskEdgeRepository.deleteAll(edgesToDelete);

        return fromNodeIds;
    }

    public void deleteTaskNodesByIds(List<UUID> taskNodeIds) {
        if (taskNodeIds == null || taskNodeIds.isEmpty()) {
            return;
        }
        List<TaskNode> nodesToDelete = taskNodeRepository.findAllById(taskNodeIds);
        taskNodeRepository.deleteAll(nodesToDelete);
    }
}





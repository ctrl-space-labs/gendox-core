package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskNodeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskEdgePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskNodePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeRelationshipTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskService {
    Logger logger = LoggerFactory.getLogger(TaskService.class);
    private final TaskRepository taskRepository;
    private final TaskNodeRepository taskNodeRepository;
    private final TaskEdgeRepository taskEdgeRepository;
    private final TypeService typeService;
    private final TaskNodeConverter taskNodeConverter;


    @Autowired
    public TaskService(TaskRepository taskRepository,
                       TaskNodeRepository taskNodeRepository,
                       TaskEdgeRepository taskEdgeRepository,
                       TypeService typeService,
                       TaskNodeConverter taskNodeConverter) {
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.taskEdgeRepository = taskEdgeRepository;
        this.typeService = typeService;
        this.taskNodeConverter = taskNodeConverter;
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



    public Optional<TaskNode> findAnswerNodeByDocumentAndQuestionOptional(UUID taskId, UUID documentNodeId, UUID questionNodeId) {
        logger.info("Fetching answer node for task: {}, document: {}, question: {}", taskId, documentNodeId, questionNodeId);
        return taskNodeRepository.findAnswerNodeByDocumentAndQuestion(taskId, documentNodeId, questionNodeId);
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

    public List<TaskEdge> createAnswerEdges(List<AnswerCreationDTO> newAnswerDTOs) throws GendoxException {
        if (newAnswerDTOs == null || newAnswerDTOs.isEmpty()) {
            logger.warn("No new answers provided for creating edges");
            return new ArrayList<>(); // Return empty list if no answers
        }

        Type answersRelationType = typeService.getTaskNodeRelationshipTypeByName(TaskNodeRelationshipTypeConstants.ANSWERS);

        List<TaskEdge> edgesToSave = new ArrayList<>();

        for (AnswerCreationDTO dto : newAnswerDTOs) {
            // Convert DTO to entity and save
            TaskNode answerNode = taskNodeConverter.toEntity(dto.getNewAnswer());
            TaskNode savedAnswerNode = taskNodeRepository.save(answerNode);

            // Create edge to document node
            TaskEdge docEdge = new TaskEdge();
            docEdge.setFromNode(savedAnswerNode);
            docEdge.setToNode(dto.getDocumentNode());
            docEdge.setRelationType(answersRelationType);
            edgesToSave.add(docEdge);

            // Create edge to question node
            TaskEdge questionEdge = new TaskEdge();
            questionEdge.setFromNode(savedAnswerNode);
            questionEdge.setToNode(dto.getQuestionNode());
            questionEdge.setRelationType(answersRelationType);
            edgesToSave.add(questionEdge);
        }

        return taskEdgeRepository.saveAll(edgesToSave);
    }

    public void deleteTaskNodesByIds(List<UUID> taskNodeIds) {
        if (taskNodeIds == null || taskNodeIds.isEmpty()) {
            return;
        }
        List<TaskNode> nodesToDelete = taskNodeRepository.findAllById(taskNodeIds);
        taskNodeRepository.deleteAll(nodesToDelete);
    }

    public void deleteTaskEdgesByIds(List<UUID> taskEdgeIds) {
        if (taskEdgeIds == null || taskEdgeIds.isEmpty()) {
            return;
        }
        List<TaskEdge> edgesToDelete = taskEdgeRepository.findAllById(taskEdgeIds);
        taskEdgeRepository.deleteAll(edgesToDelete);
    }

    public void deleteTaskEdgesByFromNodeIds(List<UUID> fromNodeIds) {
        if (fromNodeIds == null || fromNodeIds.isEmpty()) {
            return;
        }
        List<TaskEdge> edgesToDelete = taskEdgeRepository.findAllByFromNodeIdIn(fromNodeIds);
        taskEdgeRepository.deleteAll(edgesToDelete);
    }

    public Page<TaskDocumentQuestionPairDTO> getDocumentQuestionPairs(UUID taskId, Pageable pageable) {
        Type documentNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.DOCUMENT);
        Type questionNodeType = typeService.getTaskNodeTypeByName(TaskNodeTypeConstants.QUESTION);

        List<Object[]> documentQuestionPairs = taskNodeRepository.findDocumentQuestionPairs(
                taskId,
                documentNodeType.getId(),
                questionNodeType.getId(),
                pageable);

        List<TaskDocumentQuestionPairDTO> dtos = documentQuestionPairs.stream()
                .map(arr -> {
                    TaskNode docNode = (TaskNode) arr[0];
                    TaskNode questionNode = (TaskNode) arr[1];
                    return TaskDocumentQuestionPairDTO.builder()
                            .taskId(taskId)
                            .documentNode(docNode)
                            .questionNode(questionNode)
                            .build();
                }).collect(Collectors.toList());

        // You will need total count for correct Page implementation, so get that too:
        long totalCount = dtos.size(); // or implement count query if needed
        return new PageImpl<>(dtos, pageable, totalCount);
    }

}





package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskNodeConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.TaskEdgeCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.AnswerCreationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskEdgeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TaskNodeRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.TaskEdgePredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeRelationshipTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TaskEdgeService {
    Logger logger = LoggerFactory.getLogger(TaskEdgeService.class);

    private final TaskNodeRepository taskNodeRepository;
    private final TaskEdgeRepository taskEdgeRepository;
    private final TypeService typeService;
    private final TaskNodeConverter taskNodeConverter;


    @Autowired
    public TaskEdgeService(TaskNodeRepository taskNodeRepository,
                           TaskEdgeRepository taskEdgeRepository,
                           TypeService typeService,
                           TaskNodeConverter taskNodeConverter) {
        this.taskNodeRepository = taskNodeRepository;
        this.taskEdgeRepository = taskEdgeRepository;
        this.typeService = typeService;
        this.taskNodeConverter = taskNodeConverter;
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


    public List<TaskEdge> createAnswerNodesAndEdges(List<AnswerCreationDTO> newAnswerDTOs) throws GendoxException {
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
            if (!(dto.getDocumentNode() == null)) {
                TaskEdge docEdge = new TaskEdge();
                docEdge.setFromNode(savedAnswerNode);
                docEdge.setToNode(dto.getDocumentNode());
                docEdge.setRelationType(answersRelationType);
                edgesToSave.add(docEdge);
            }

            // Create edge to question node
            if (!(dto.getQuestionNode() == null)) {
                TaskEdge questionEdge = new TaskEdge();
                questionEdge.setFromNode(savedAnswerNode);
                questionEdge.setToNode(dto.getQuestionNode());
                questionEdge.setRelationType(answersRelationType);
                edgesToSave.add(questionEdge);
            }
        }

        return taskEdgeRepository.saveAll(edgesToSave);
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

    public void deleteTaskEdgesByNodeIds(List<TaskNode> taskNodes) {
        if (taskNodes == null || taskNodes.isEmpty()) {
            return;
        }
        List<UUID> taskNodeIds = taskNodes.stream()
                .map(TaskNode::getId)
                .collect(Collectors.toList());
        List<TaskEdge> edgesToDeleteTo = taskEdgeRepository.findAllByToNodeIdIn(taskNodeIds);
        if (!edgesToDeleteTo.isEmpty()) {
            logger.info("Deleting task edges to nodes: {}", taskNodeIds);
            taskEdgeRepository.deleteAll(edgesToDeleteTo);
        }
        taskEdgeRepository.deleteAll(edgesToDeleteTo);
        List<TaskEdge> edgesToDeleteFrom = taskEdgeRepository.findAllByFromNodeIdIn(taskNodeIds);
        if (!edgesToDeleteFrom.isEmpty()) {
            logger.info("Deleting task edges from nodes: {}", taskNodeIds);
            taskEdgeRepository.deleteAll(edgesToDeleteFrom);
        }
    }

}

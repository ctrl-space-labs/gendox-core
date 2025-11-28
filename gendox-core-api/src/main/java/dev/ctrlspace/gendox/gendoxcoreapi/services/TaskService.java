package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.*;

@Service
public class TaskService {
    Logger logger = LoggerFactory.getLogger(TaskService.class);
    private final TaskRepository taskRepository;
    private final TaskNodeRepository taskNodeRepository;
    private final TaskEdgeService taskEdgeService;
    private final TypeService typeService;
    private TaskConverter taskConverter;
    private AiModelService aiModelService;

    @Autowired
    public TaskService(TaskRepository taskRepository,
                       TaskNodeRepository taskNodeRepository,
                       TypeService typeService,
                       TaskEdgeService taskEdgeService,
                       TaskConverter taskConverter,
                       AiModelService aiModelService) {
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.typeService = typeService;
        this.taskEdgeService = taskEdgeService;
        this.taskConverter = taskConverter;
        this.aiModelService = aiModelService;
    }

    public Task createTask(UUID projectId, TaskDTO taskDTO) throws GendoxException {
        Task task = taskConverter.toEntity(taskDTO);
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

    public Task updateTask(UUID taskId, TaskDTO taskDTO) throws GendoxException {
        logger.info("Updating task: {}", taskId);

        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found for update"));


        // Update projectId
        if (taskDTO.getProjectId() != null) {
            existingTask.setProjectId(taskDTO.getProjectId());
        }

        // Update type
        if (taskDTO.getType() != null) {
            existingTask.setTaskType(typeService.getTaskTypeByName(taskDTO.getType()));
        }

        // Update title
        if (taskDTO.getTitle() != null) {
            existingTask.setTitle(taskDTO.getTitle());
        }

        // Update description
        if (taskDTO.getDescription() != null) {
            existingTask.setDescription(taskDTO.getDescription());
        }

        // Update completionModel
        if (taskDTO.getCompletionModel() != null) {
            String modelName = taskDTO.getCompletionModel().getName();

            if (modelName != null && !modelName.isBlank()) {
                AiModel completionModel = aiModelService.getByName(modelName);

                if (!completionModel.getIsActive()) {
                    throw new GendoxException(
                            "INACTIVE_COMPLETION_MODEL",
                            "The selected completion model is inactive",
                            HttpStatus.FORBIDDEN
                    );
                }

                existingTask.setCompletionModel(completionModel);
            }
        }


        // Update taskPrompt
        if (taskDTO.getTaskPrompt() != null) {
            existingTask.setTaskPrompt(taskDTO.getTaskPrompt());
        }

        // Update maxToken
        if (taskDTO.getMaxToken() != null) {
            existingTask.setMaxToken(taskDTO.getMaxToken());
        }

        // Update temperature
        if (taskDTO.getTemperature() != null) {
            existingTask.setTemperature(taskDTO.getTemperature());
        }

        // Update topP
        if (taskDTO.getTopP() != null) {
            existingTask.setTopP(taskDTO.getTopP());
        }

        return taskRepository.save(existingTask);
    }


    @Transactional
    public void deleteTask(UUID taskId) throws GendoxException {
        logger.info("Deleting task: {}", taskId);

        // Fetch the task to delete
        Task taskToDelete = taskRepository.findById(taskId)
                .orElseThrow(() -> new GendoxException("TASK_NOT_FOUND", "Task not found for deletion", HttpStatus.NOT_FOUND));

        Page<TaskNode> nodesToDelete = taskNodeRepository.findAllByTaskId(taskId, Pageable.unpaged());

        // Delete all task edges associated with this task
        taskEdgeService.deleteTaskEdgesByNodeIds(nodesToDelete.getContent());

        // Delete all task nodes associated with this task
        if (!nodesToDelete.isEmpty()) {
            taskNodeRepository.deleteAll(nodesToDelete);
        }

        // Finally, delete the task itself
        taskRepository.delete(taskToDelete);
    }


}





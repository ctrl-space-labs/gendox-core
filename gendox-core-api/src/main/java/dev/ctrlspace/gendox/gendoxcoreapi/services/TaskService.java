package dev.ctrlspace.gendox.gendoxcoreapi.services;

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


    @Autowired
    public TaskService(TaskRepository taskRepository,
                       TaskNodeRepository taskNodeRepository,
                       TypeService typeService,
                       TaskEdgeService taskEdgeService) {
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.typeService = typeService;
        this.taskEdgeService = taskEdgeService;
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

    public Task updateTask(UUID taskId, TaskDTO taskDTO) {
        logger.info("Updating task: {}", taskId);
        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found for update"));

        existingTask.setTitle(taskDTO.getTitle());
        existingTask.setDescription(taskDTO.getDescription());
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





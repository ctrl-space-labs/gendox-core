package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.TaskConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDuplicateDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskNodeTypeConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.TaskTypeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
    private final EOScriptService eoScriptService;
    private final EOTaskGeometryService eoTaskGeometryServicey;
    private TaskConverter taskConverter;
    private AiModelService aiModelService;
    private TaskNodeService taskNodeService;

    private Integer maxQuestionsPerBucket;
    private Integer maxQuestionTokensPerBucket;
    private Integer maxSectionsChunkTokens;

    @Autowired
    public TaskService(TaskRepository taskRepository,
                       TaskNodeRepository taskNodeRepository,
                       TypeService typeService,
                       TaskEdgeService taskEdgeService,
                       EOScriptService eoScriptRepository,
                       EOTaskGeometryService eoTaskGeometryRepository,
                       TaskConverter taskConverter,
                       AiModelService aiModelService,
                       TaskNodeService taskNodeService,
                       @Value("${gendox.tasks.max-questions-per-bucket}") Integer maxQuestionsPerBucket,
                       @Value("${gendox.tasks.max-question-tokens-per-bucket}") Integer maxQuestionTokensPerBucket,
                       @Value("${gendox.tasks.max-sections-chunk-tokens}") Integer maxSectionsChunkTokens) {
        this.taskRepository = taskRepository;
        this.taskNodeRepository = taskNodeRepository;
        this.typeService = typeService;
        this.taskEdgeService = taskEdgeService;
        this.eoScriptService = eoScriptRepository;
        this.eoTaskGeometryServicey = eoTaskGeometryRepository;
        this.taskConverter = taskConverter;
        this.aiModelService = aiModelService;
        this.taskNodeService = taskNodeService;
        this.maxQuestionsPerBucket = maxQuestionsPerBucket;
        this.maxQuestionTokensPerBucket = maxQuestionTokensPerBucket;
        this.maxSectionsChunkTokens = maxSectionsChunkTokens;
    }

    public Task createTask(UUID projectId, TaskDTO taskDTO) throws GendoxException {
        Task task = taskConverter.toEntity(taskDTO);
        // defaults
        if (task.getMaxQuestionsPerBucket() == null) {
            task.setMaxQuestionsPerBucket(this.maxQuestionsPerBucket);
        }
        if (task.getMaxQuestionTokensPerBucket() == null) {
            task.setMaxQuestionTokensPerBucket(this.maxQuestionTokensPerBucket);
        }
        if (task.getMaxSectionsChunkTokens() == null) {
            task.setMaxSectionsChunkTokens(this.maxSectionsChunkTokens);
        }
        logger.debug("Creating new task: {}", task);
        return taskRepository.save(task);
    }

    public Task duplicateTask(UUID projectId, TaskDuplicateDTO taskDuplicateDTO) throws GendoxException {
        logger.debug("Duplicating task {} with options: keepQuestions={}, keepDocuments={}",
                taskDuplicateDTO.getTaskId(), taskDuplicateDTO.isKeepQuestions(), taskDuplicateDTO.isKeepDocuments());

        Task original = taskRepository.findById(taskDuplicateDTO.getTaskId())
                .orElseThrow(() -> new GendoxException("TASK_NOT_FOUND", "Task not found", HttpStatus.NOT_FOUND));

        TaskDTO newTaskDTO = taskConverter.toDTO(original);
        newTaskDTO.setId(null);
        newTaskDTO.setProjectId(projectId);
        if (taskDuplicateDTO.getNewTitle() != null) {
            newTaskDTO.setTitle(taskDuplicateDTO.getNewTitle());
        }
        if (taskDuplicateDTO.getNewDescription() != null) {
            newTaskDTO.setDescription(taskDuplicateDTO.getNewDescription());
        }

        Task newTask = this.createTask(projectId, newTaskDTO);

        List<TaskNode> nodesToSave = new ArrayList<>();

        // COPY QUESTIONS
        if (taskDuplicateDTO.isKeepQuestions()) {
            Page<TaskNode> questionNodes = taskNodeService.getTaskNodesByType(taskDuplicateDTO.getTaskId(), TaskNodeTypeConstants.QUESTION);

            for (TaskNode questionNode : questionNodes) {
                TaskNode newQuestionNode = new TaskNode();
                newQuestionNode.setTaskId(newTask.getId());
                newQuestionNode.setNodeType(questionNode.getNodeType());

                // Node Value
                TaskNodeValueDTO newQuestionValue = new TaskNodeValueDTO();
                if (questionNode.getNodeValue() != null) {
                    // only order, questionTitle, message are relevant for question nodes
                    newQuestionValue.setOrder(questionNode.getNodeValue().getOrder());
                    newQuestionValue.setQuestionTitle(questionNode.getNodeValue().getQuestionTitle());
                    newQuestionValue.setMessage(questionNode.getNodeValue().getMessage());

                    if (questionNode.getNodeValue().getDocumentMetadata().getSupportingDocumentIds() != null) {
                        newQuestionValue.setDocumentMetadata(new TaskDocumentMetadataDTO());
                        newQuestionValue.getDocumentMetadata().setSupportingDocumentIds(
                                new ArrayList<>(questionNode.getNodeValue().getDocumentMetadata().getSupportingDocumentIds())
                        );
                    }
                }
                newQuestionNode.setNodeValue(newQuestionValue);

                nodesToSave.add(newQuestionNode);
            }
        }


        // COPY DOCUMENTS
        if (taskDuplicateDTO.isKeepDocuments()) {
            Page<TaskNode> documentNodes = taskNodeService.getTaskNodesByType(taskDuplicateDTO.getTaskId(), TaskNodeTypeConstants.DOCUMENT);

            for (TaskNode documentNode : documentNodes) {
                TaskNode newDocumentNode = new TaskNode();
                newDocumentNode.setTaskId(newTask.getId());
                newDocumentNode.setNodeType(documentNode.getNodeType());
                newDocumentNode.setDocumentId(documentNode.getDocumentId());
                nodesToSave.add(newDocumentNode);
                if (documentNode.getNodeValue().getDocumentMetadata().getSupportingDocumentIds() != null) {
                    TaskNodeValueDTO newDocumentValue = new TaskNodeValueDTO();
                    newDocumentValue.setDocumentMetadata(new TaskDocumentMetadataDTO());
                    newDocumentValue.getDocumentMetadata().setSupportingDocumentIds(
                            new ArrayList<>(documentNode.getNodeValue().getDocumentMetadata().getSupportingDocumentIds())
                    );
                    newDocumentNode.setNodeValue(newDocumentValue);
                }
            }
        }

        if (!nodesToSave.isEmpty()) {
            taskNodeRepository.saveAll(nodesToSave);
        }

        return newTask;
    }


    public List<Task> getAllTasksByProjectId(UUID projectId) {
        logger.debug("Fetching all tasks for project: {}", projectId);
        return taskRepository.findAllByProjectId(projectId);
    }

    public Task getTaskById(UUID taskId) {
        logger.debug("Fetching task by ID: {}", taskId);
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    public Task updateTask(UUID taskId, TaskDTO taskDTO) throws GendoxException {
        logger.debug("Updating task: {}", taskId);

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
        logger.debug("Deleting task: {}", taskId);

        // Fetch the task to delete
        Task taskToDelete = taskRepository.findById(taskId)
                .orElseThrow(() -> new GendoxException("TASK_NOT_FOUND", "Task not found for deletion", HttpStatus.NOT_FOUND));

        // Delete EO children for task type Earth Observation
        if (taskToDelete.getTaskType() != null &&
                TaskTypeConstants.EARTH_OBSERVATION.equals(taskToDelete.getTaskType().getName())) {
            eoScriptService.deleteAllEOScriptsForTask(taskId);
            eoTaskGeometryServicey.deleteAllByTaskId(taskId);
        }

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

    /**
     * Builds completion runtime overrides from task settings (model, maxTokens, temperature, topP).
     * Used by batch job processors (documentInsights, documentDigitization) to apply task-level overrides to completions.
     */
    public CompletionRuntimeOverridesDTO buildDefaultCompletionOverrides(Task task) {
        // TODO: add override to add extra tools and maybe system prompt
        CompletionRuntimeOverridesDTO overrides = new CompletionRuntimeOverridesDTO();
        if (task.getCompletionModel() != null) {
            overrides.setCompletionModelName(task.getCompletionModel().getName());
        }
        if (task.getMaxToken() != null) {
            overrides.setMaxTokens(task.getMaxToken());
        }
        if (task.getTemperature() != null) {
            overrides.setTemperature(task.getTemperature());
        }
        if (task.getTopP() != null) {
            overrides.setTopP(task.getTopP());
        }
        return overrides;
    }

}





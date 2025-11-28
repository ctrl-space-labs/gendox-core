package dev.ctrlspace.gendox.gendoxcoreapi.converters;


import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Task;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class TaskConverter implements GendoxConverter <Task, TaskDTO> {

    private TypeService typeService;
    private AiModelService aiModelService;

    @Autowired
    public TaskConverter(TypeService typeService,
                         AiModelService aiModelService) {
        this.typeService = typeService;
        this.aiModelService = aiModelService;
    }


    @Override
    public TaskDTO toDTO(Task task) throws GendoxException, JsonProcessingException {
        return TaskDTO.builder()
                .id(task.getId())
                .projectId(task.getProjectId())
                .type(task.getTaskType() != null ? task.getTaskType().getName() : null)
                .title(task.getTitle())
                .description(task.getDescription())
                .completionModel(task.getCompletionModel())
                .taskPrompt(task.getTaskPrompt())
                .maxToken(task.getMaxToken())
                .temperature(task.getTemperature())
                .topP(task.getTopP())
                .build();
    }

    @Override
    public Task toEntity(TaskDTO taskDTO) throws GendoxException {
        Task task = new Task();
        if (taskDTO.getId() != null) {
            task.setId(taskDTO.getId());
        }
        if (taskDTO.getProjectId() != null) {
            task.setProjectId(taskDTO.getProjectId());
        }
        if (taskDTO.getType() != null) {
            task.setTaskType(typeService.getTaskTypeByName(taskDTO.getType()));
        }
        if (taskDTO.getTitle() != null) {
            task.setTitle(taskDTO.getTitle());
        }
        if (taskDTO.getDescription() != null) {
            task.setDescription(taskDTO.getDescription());
        }
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

                task.setCompletionModel(completionModel);
            }
        }
        if (taskDTO.getTaskPrompt() != null) {
            task.setTaskPrompt(taskDTO.getTaskPrompt());
        }
        if (taskDTO.getMaxToken() != null) {
            task.setMaxToken(taskDTO.getMaxToken());
        }
        if (taskDTO.getTemperature() != null) {
            task.setTemperature(taskDTO.getTemperature());
        }
        if (taskDTO.getTopP() != null) {
            task.setTopP(taskDTO.getTopP());
        }
        return task;
    }
}

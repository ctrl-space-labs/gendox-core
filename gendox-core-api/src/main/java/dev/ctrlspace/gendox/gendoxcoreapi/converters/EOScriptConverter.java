package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EOScript;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EOScriptDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EOScriptConverter implements GendoxConverter<EOScript, EOScriptDTO> {
    private static TaskService taskService;

    @Autowired
    public EOScriptConverter(TaskService taskService) {
        EOScriptConverter.taskService = taskService;
    }

    @Override
    public EOScriptDTO toDTO(EOScript eoScript) {
        EOScriptDTO eoScriptDTO = new EOScriptDTO();

        eoScriptDTO.setId(eoScript.getId());
        eoScriptDTO.setTaskId(eoScript.getTask().getId());
        eoScriptDTO.setTitle(eoScript.getTitle());
        eoScriptDTO.setDescription(eoScript.getDescription());
        eoScriptDTO.setScriptContent(eoScript.getScriptContent());
        eoScriptDTO.setIsLatestVersion(eoScript.getLatestVersion());

        return eoScriptDTO;
    }

    @Override
    public EOScript toEntity(EOScriptDTO eoScriptDTO) {
        EOScript eoScript = new EOScript();

        if (eoScriptDTO.getId() != null) {
            eoScript.setId(eoScriptDTO.getId());
        }
        if (eoScriptDTO.getTaskId() != null) {
            eoScript.setTask(taskService.getTaskById(eoScriptDTO.getTaskId()));
        }
        if (eoScriptDTO.getTitle() != null) {
            eoScript.setTitle(eoScriptDTO.getTitle());
        }
        if (eoScriptDTO.getDescription() != null) {
            eoScript.setDescription(eoScriptDTO.getDescription());
        }
        if (eoScriptDTO.getScriptContent() != null) {
            eoScript.setScriptContent(eoScriptDTO.getScriptContent());
        }
        if (eoScriptDTO.getIsLatestVersion() != null) {
            eoScript.setLatestVersion(eoScriptDTO.getIsLatestVersion());
        }

        return eoScript;
    }
}

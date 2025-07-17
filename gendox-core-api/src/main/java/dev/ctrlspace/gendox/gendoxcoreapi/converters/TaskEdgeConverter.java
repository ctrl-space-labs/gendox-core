package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskEdge;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskEdgeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TaskNodeService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.springframework.stereotype.Component;

@Component
public class TaskEdgeConverter implements GendoxConverter<TaskEdge, TaskEdgeDTO> {
    private final TypeService typeService;
    private final TaskNodeService taskNodeService;

    public TaskEdgeConverter(TypeService typeService,
                             TaskNodeService taskNodeService) {
        this.typeService = typeService;
        this.taskNodeService = taskNodeService;
    }

    @Override
    public TaskEdgeDTO toDTO(TaskEdge taskEdge) throws GendoxException, JsonProcessingException {
        return null;
    }

    @Override
    public TaskEdge toEntity(TaskEdgeDTO taskEdgeDTO) throws GendoxException {
        TaskEdge taskEdge = new TaskEdge();
        if (taskEdgeDTO.getId() != null) {
            taskEdge.setId(taskEdgeDTO.getId());
        }
        if (taskEdgeDTO.getFromNodeId() != null) {
            taskEdge.setFromNode(taskNodeService.getTaskNodeById(taskEdgeDTO.getFromNodeId()));
        }
        if (taskEdgeDTO.getToNodeId() != null) {
            taskEdge.setToNode(taskNodeService.getTaskNodeById(taskEdgeDTO.getToNodeId()));
        }
        if (taskEdgeDTO.getRelationType() != null) {
            taskEdge.setRelationType(typeService.getTaskNodeRelationshipTypeByName(taskEdgeDTO.getRelationType()));
        }
        if (taskEdgeDTO.getUserId() != null) {
            taskEdge.setCreatedBy(taskEdgeDTO.getUserId());
        }
        if (taskEdgeDTO.getUserId() != null) {
            taskEdge.setUpdatedBy(taskEdgeDTO.getUserId());
        }
        return taskEdge;
    }
}

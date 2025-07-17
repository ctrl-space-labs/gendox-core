package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TaskNodeConverter implements GendoxConverter<TaskNode, TaskNodeDTO> {
    private TypeService typeService;


    @Autowired
    public TaskNodeConverter(TypeService typeService) {
        this.typeService = typeService;
    }


    @Override
    public TaskNodeDTO toDTO(TaskNode taskNode) throws GendoxException {
        return TaskNodeDTO.builder()
                .id(taskNode.getId())
                .taskId(taskNode.getTaskId())
                .nodeType(taskNode.getNodeType() != null ? taskNode.getNodeType().getName() : null)
                .nodeValue(taskNode.getNodeValue() != null ? taskNode.getNodeValue().toBuilder().build() : null)
                .parentNodeId(taskNode.getParentNodeId())
                .documentId(taskNode.getDocumentId() != null ? taskNode.getDocumentId() : null)
                .pageNumber(taskNode.getPageNumber())
                .userId(taskNode.getCreatedBy())
                .build();
    }

    @Override
    public TaskNode toEntity(TaskNodeDTO taskNodeDTO) throws GendoxException {
        TaskNode taskNode = new TaskNode();
        if (taskNodeDTO.getId() != null) {
            taskNode.setId(taskNodeDTO.getId());
        }
        if (taskNodeDTO.getTaskId() != null) {
            taskNode.setTaskId(taskNodeDTO.getTaskId());
        }
        if (taskNodeDTO.getNodeType() != null) {
            taskNode.setNodeType(typeService.getTaskNodeTypeByName(taskNodeDTO.getNodeType()));
        }
        if (taskNodeDTO.getNodeValue() != null) {
            taskNode.setNodeValue(taskNodeDTO.getNodeValue().toBuilder().build());
        }
        if (taskNodeDTO.getParentNodeId() != null) {
            taskNode.setParentNodeId(taskNodeDTO.getParentNodeId());
        }
        if (taskNodeDTO.getDocumentId() != null) {
            taskNode.setDocumentId(taskNodeDTO.getDocumentId());
        }
        if (taskNodeDTO.getUserId() != null) {
            taskNode.setCreatedBy(taskNodeDTO.getUserId());
        }
        if (taskNodeDTO.getUserId() != null) {
            taskNode.setUpdatedBy(taskNodeDTO.getUserId());
        }

        return taskNode;
    }
}

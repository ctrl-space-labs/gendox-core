package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.TaskNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.TaskNodeDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class TaskNodeConverter implements GendoxConverter<TaskNode, TaskNodeDTO> {
    private TypeService typeService;
    private DocumentService documentService;

    @Autowired
    public TaskNodeConverter(TypeService typeService,
                             DocumentService documentService) {
        this.typeService = typeService;
        this.documentService = documentService;
    }


    @Override
    public TaskNodeDTO toDTO(TaskNode taskNode) throws GendoxException {
        return null;
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
        if (taskNodeDTO.getContent() != null) {
            taskNode.setContent(taskNodeDTO.getContent());
        }
        if (taskNodeDTO.getParentNodeId() != null) {
            taskNode.setParentNodeId(taskNodeDTO.getParentNodeId());
        }
        if (taskNodeDTO.getDocumentId() != null) {
            taskNode.setDocument(documentService.getDocumentInstanceById(taskNodeDTO.getDocumentId()));
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

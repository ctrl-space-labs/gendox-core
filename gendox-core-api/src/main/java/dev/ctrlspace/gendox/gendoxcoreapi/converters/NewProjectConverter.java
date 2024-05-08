package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.NewProjectDTO;
import org.springframework.stereotype.Component;

@Component
public class NewProjectConverter implements GendoxConverter<Project, NewProjectDTO>{


    @Override
    public NewProjectDTO toDTO(Project project) throws GendoxException {
        NewProjectDTO newprojectDTO = new NewProjectDTO();

        newprojectDTO.setId(project.getId());
        newprojectDTO.setOrganizationId(project.getOrganizationId());
        newprojectDTO.setName(project.getName());
        newprojectDTO.setDescription(project.getDescription());
        newprojectDTO.setCreatedAt(project.getCreatedAt());
        newprojectDTO.setUpdatedAt(project.getUpdatedAt());
        newprojectDTO.setAutoTraining(project.getAutoTraining());

        return newprojectDTO;

    }

    @Override
    public Project toEntity(NewProjectDTO newProjectDTO) {
        Project project = new Project();

        project.setId(newProjectDTO.getId());
        project.setOrganizationId(newProjectDTO.getOrganizationId());
        project.setName(newProjectDTO.getName());
        project.setDescription(newProjectDTO.getDescription());
        project.setCreatedAt(newProjectDTO.getCreatedAt());
        project.setUpdatedAt(newProjectDTO.getUpdatedAt());
        project.setAutoTraining(newProjectDTO.getAutoTraining());
        if (newProjectDTO.getAutoTraining() == null) {
            project.setAutoTraining(false);}

        return project;
    }
}

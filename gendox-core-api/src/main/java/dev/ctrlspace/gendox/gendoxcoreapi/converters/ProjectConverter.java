package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectAgentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ProjectConverter implements GendoxConverter<Project, ProjectDTO> {

    private ProjectAgentConverter projectAgentConverter;

    @Autowired
    public ProjectConverter(ProjectAgentConverter projectAgentConverter) {
        this.projectAgentConverter = projectAgentConverter;
    }

    @Override
    public ProjectDTO toDTO(Project project) {
        ProjectDTO projectDTO = new ProjectDTO();

        projectDTO.setId(project.getId());
        projectDTO.setOrganizationId(project.getOrganizationId());
        projectDTO.setName(project.getName());
        projectDTO.setDescription(project.getDescription());
        projectDTO.setCreatedAt(project.getCreatedAt());
        projectDTO.setUpdatedAt(project.getUpdatedAt());

        ProjectAgentDTO agentDTO = projectAgentConverter.toDTO(project.getProjectAgent());
        projectDTO.setProjectAgentDTO(agentDTO);



        return projectDTO;
    }

    @Override
    public Project toEntity(ProjectDTO projectDTO) {
        Project project = new Project();

        project.setId(projectDTO.getId());
        project.setOrganizationId(projectDTO.getOrganizationId());
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        project.setCreatedAt(projectDTO.getCreatedAt());
        project.setUpdatedAt(projectDTO.getUpdatedAt());

        ProjectAgent agent = projectAgentConverter.toEntity(projectDTO.getProjectAgentDTO());
        project.setProjectAgent(agent);




        return project;
    }
}
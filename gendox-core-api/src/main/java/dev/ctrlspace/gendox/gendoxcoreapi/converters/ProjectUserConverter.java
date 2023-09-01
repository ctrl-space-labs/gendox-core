package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectOrganizationDTO;
import org.springframework.stereotype.Component;

@Component
public class ProjectUserConverter implements GendoxConverter<Project, ProjectOrganizationDTO> {

    public ProjectOrganizationDTO toDTO(Project project) {
        return ProjectOrganizationDTO
                .builder()
                .id(String.valueOf(project.getId()))
                .name(project.getName())
                .description(project.getDescription())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();

    }

    @Override
    public Project toEntity(ProjectOrganizationDTO projectOrganizationDTO) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}
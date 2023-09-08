package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectMemberDTO;
import org.springframework.stereotype.Component;

@Component
public class ProjectMemberConverter implements GendoxConverter<ProjectMember, ProjectMemberDTO> {
    @Override
    public ProjectMemberDTO toDTO(ProjectMember projectMember) {
        ProjectMemberDTO projectMemberDTO = new ProjectMemberDTO();

        projectMemberDTO.setId(projectMember.getId());
        projectMemberDTO.setProject(projectMember.getProject());
        projectMemberDTO.setUser(projectMember.getUser());
        projectMemberDTO.setCreateAt(projectMember.getCreatedAt());
        projectMemberDTO.setUpdateAt(projectMember.getUpdatedAt());

        return projectMemberDTO;
    }

    @Override
    public ProjectMember toEntity(ProjectMemberDTO projectMemberDTO) {
        ProjectMember projectMember = new ProjectMember();

        projectMember.setId(projectMemberDTO.getId());
        projectMember.setProject(projectMemberDTO.getProject());
        projectMember.setUser(projectMemberDTO.getUser());
        projectMember.setCreatedAt(projectMemberDTO.getCreateAt());
        projectMember.setUpdatedAt(projectMemberDTO.getUpdateAt());

        return projectMember;
    }
}

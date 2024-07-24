package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectAgentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.ProjectOrganizationDTO;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AgentUserConverter implements GendoxConverter<ProjectAgent, ProjectAgentDTO>{

    @Override
    public ProjectAgentDTO toDTO(ProjectAgent projectAgent) {
        return ProjectAgentDTO
                .builder()
                .id(projectAgent.getId())
                .userId(projectAgent.getUserId())
                .agentName(projectAgent.getAgentName())
                .projectId(projectAgent.getProject().getId())
                .createdAt(projectAgent.getCreatedAt())
                .updatedAt(projectAgent.getUpdatedAt())
                .build();
    }

    @Override
    public ProjectAgent toEntity(ProjectAgentDTO projectAgentDTO) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}

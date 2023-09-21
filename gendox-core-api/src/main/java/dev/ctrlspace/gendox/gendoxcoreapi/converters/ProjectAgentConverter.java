package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectAgentDTO;
import org.springframework.stereotype.Component;

@Component
public class ProjectAgentConverter implements GendoxConverter<ProjectAgent, ProjectAgentDTO> {
    @Override
    public ProjectAgentDTO toDTO(ProjectAgent projectAgent) {
        ProjectAgentDTO projectAgentDTO = new ProjectAgentDTO();

        projectAgentDTO.setId(projectAgent.getId()) ;
        projectAgentDTO.setSemanticSearchModelId(projectAgent.getSemanticSearchModelId());
        projectAgentDTO.setCompletionModelId(projectAgent.getCompletionModelId());
        projectAgentDTO.setAgentName(projectAgentDTO.getAgentName());
        projectAgentDTO.setAgentBehavior(projectAgentDTO.getAgentBehavior());
        projectAgentDTO.setPrivateAgent(projectAgent.getPrivateAgent());
        projectAgentDTO.setCreateAt(projectAgent.getCreatedAt());
        projectAgentDTO.setUpdateAt(projectAgent.getUpdatedAt());
//        projectAgentDTO.setProject(projectAgentDTO.getProject());


        return projectAgentDTO;
    }

    @Override
    public ProjectAgent toEntity(ProjectAgentDTO projectAgentDTO) {
        ProjectAgent projectAgent = new ProjectAgent();

        projectAgent.setId(projectAgentDTO.getId());
        projectAgent.setSemanticSearchModelId(projectAgentDTO.getSemanticSearchModelId());
        projectAgent.setCompletionModelId(projectAgentDTO.getCompletionModelId());
        projectAgent.setAgentName(projectAgentDTO.getAgentName());
        projectAgent.setAgentBehavior(projectAgentDTO.getAgentBehavior());
        projectAgent.setPrivateAgent(projectAgentDTO.getPrivateAgent());
        projectAgent.setCreatedAt(projectAgentDTO.getCreateAt());
        projectAgent.setUpdatedAt(projectAgentDTO.getUpdateAt());
//        projectAgent.setProject(projectAgentDTO.getProject());

        return projectAgent;
    }
}























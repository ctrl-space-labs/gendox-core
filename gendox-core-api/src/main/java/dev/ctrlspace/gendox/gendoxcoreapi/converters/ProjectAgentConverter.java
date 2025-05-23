package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectAgentDTO;
import org.springframework.stereotype.Component;

@Component
public class ProjectAgentConverter implements GendoxConverter<ProjectAgent, ProjectAgentDTO> {
    @Override
    public ProjectAgentDTO toDTO(ProjectAgent projectAgent) {
        ProjectAgentDTO projectAgentDTO = new ProjectAgentDTO();

        projectAgentDTO.setId(projectAgent.getId());
        projectAgentDTO.setUserId(projectAgent.getUserId());
        projectAgentDTO.setSemanticSearchModel(projectAgent.getSemanticSearchModel());
        projectAgentDTO.setCompletionModel(projectAgent.getCompletionModel());
        projectAgentDTO.setAgentName(projectAgent.getAgentName());
        projectAgentDTO.setAgentBehavior(projectAgent.getAgentBehavior());
        projectAgentDTO.setPrivateAgent(projectAgent.getPrivateAgent());
        projectAgentDTO.setCreateAt(projectAgent.getCreatedAt());
        projectAgentDTO.setUpdateAt(projectAgent.getUpdatedAt());
        projectAgentDTO.setCreatedBy(projectAgent.getCreatedBy());
        projectAgentDTO.setUpdatedBy(projectAgent.getUpdatedBy());
        projectAgentDTO.setDocumentSplitterType(projectAgent.getDocumentSplitterType());
        projectAgentDTO.setMaxToken(projectAgent.getMaxToken());
        projectAgentDTO.setTemperature(projectAgent.getTemperature());
        projectAgentDTO.setTopP(projectAgent.getTopP());
        projectAgentDTO.setModerationCheck(projectAgent.getModerationCheck());
        projectAgentDTO.setModerationModel(projectAgent.getModerationModel());
        projectAgentDTO.setAgentVcJwt(projectAgent.getAgentVcJwt());
        projectAgentDTO.setOrganizationDid(projectAgent.getOrganizationDid());
        projectAgentDTO.setMaxSearchLimit(projectAgent.getMaxSearchLimit());
        projectAgentDTO.setMaxCompletionLimit(projectAgent.getMaxCompletionLimit());

        if (projectAgent.getRerankEnable() != null) {
            projectAgentDTO.setRerankEnable(projectAgent.getRerankEnable());
        }

        if (projectAgent.getRerankModel() != null) {
            projectAgentDTO.setRerankModel(projectAgent.getRerankModel());
        }

        projectAgentDTO.setAiTools(projectAgent.getAiTools());


        return projectAgentDTO;
    }

    @Override
    public ProjectAgent toEntity(ProjectAgentDTO projectAgentDTO) {
        ProjectAgent projectAgent = new ProjectAgent();

        projectAgent.setId(projectAgentDTO.getId());
        projectAgent.setUserId(projectAgentDTO.getUserId());
        projectAgent.setSemanticSearchModel(projectAgentDTO.getSemanticSearchModel());
        projectAgent.setCompletionModel(projectAgentDTO.getCompletionModel());
        projectAgent.setAgentName(projectAgentDTO.getAgentName());
        projectAgent.setAgentBehavior(projectAgentDTO.getAgentBehavior());
        projectAgent.setPrivateAgent(projectAgentDTO.getPrivateAgent());
        projectAgent.setCreatedAt(projectAgentDTO.getCreateAt());
        projectAgent.setUpdatedAt(projectAgentDTO.getUpdateAt());
        projectAgent.setCreatedBy(projectAgentDTO.getCreatedBy());
        projectAgent.setUpdatedBy(projectAgentDTO.getUpdatedBy());
        projectAgent.setDocumentSplitterType(projectAgentDTO.getDocumentSplitterType());
        projectAgent.setMaxToken(projectAgentDTO.getMaxToken());
        projectAgent.setTemperature(projectAgentDTO.getTemperature());
        projectAgent.setTopP(projectAgentDTO.getTopP());
        projectAgent.setModerationCheck(projectAgentDTO.getModerationCheck());
        projectAgent.setModerationModel(projectAgentDTO.getModerationModel());
        projectAgent.setAgentVcJwt(projectAgentDTO.getAgentVcJwt());
        projectAgent.setOrganizationDid(projectAgentDTO.getOrganizationDid());
        projectAgent.setMaxSearchLimit(projectAgentDTO.getMaxSearchLimit());
        projectAgent.setMaxCompletionLimit(projectAgentDTO.getMaxCompletionLimit());

        if (projectAgentDTO.getRerankEnable() != null) {
            projectAgent.setRerankEnable(projectAgentDTO.getRerankEnable());
        }

        if (projectAgentDTO.getRerankModel() != null) {
            projectAgent.setRerankModel(projectAgentDTO.getRerankModel());
        }

        projectAgent.setAiTools(projectAgentDTO.getAiTools());

        return projectAgent;
    }
}























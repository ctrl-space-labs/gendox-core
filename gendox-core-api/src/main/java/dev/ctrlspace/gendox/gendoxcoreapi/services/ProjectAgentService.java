package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ProjectAgentService {

    private ProjectAgentRepository projectAgentRepository;

    @Autowired
    public ProjectAgentService(ProjectAgentRepository projectAgentRepository){
        this.projectAgentRepository = projectAgentRepository;
    }

    public ProjectAgent createProjectAgent(ProjectAgent projectAgent) throws Exception{
        Instant now = Instant.now();

        if(projectAgent.getId() != null){
            throw new GendoxException("NEW_PROJECT_AGENT_ID_IS_NOT_NULL", "Project - Agent id must be null", HttpStatus.BAD_REQUEST);

        }

        projectAgent.setCreatedAt(now);
        projectAgent.setUpdatedAt(now);

        projectAgent = projectAgentRepository.save(projectAgent);

        return projectAgent;
    }


    public ProjectAgent updateProjectAgent(ProjectAgent projectAgent) throws GendoxException{
        UUID projectAgentId = projectAgent.getId();
        ProjectAgent existingProjectAgent = projectAgentRepository.getById(projectAgentId);

        // Update the properties
        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setSemanticSearchModelId(projectAgent.getSemanticSearchModelId());
        existingProjectAgent.setCompletionModelId(projectAgent.getCompletionModelId());
        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setAgentBehavior(projectAgent.getAgentBehavior());
        existingProjectAgent.setPrivateAgent(projectAgent.getPrivateAgent());
        existingProjectAgent.setCreatedAt(projectAgent.getCreatedAt());
        existingProjectAgent.setUpdatedAt(Instant.now());

        existingProjectAgent = projectAgentRepository.save(existingProjectAgent);
        return existingProjectAgent;
    }
}



























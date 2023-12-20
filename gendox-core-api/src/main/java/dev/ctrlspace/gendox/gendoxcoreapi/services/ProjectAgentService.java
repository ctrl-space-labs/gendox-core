package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ProjectAgentService {


    @Value("${gendox.agents.splitter-type}")
    private String splitterTypeName;
    @Value("${gendox.agents.max_token}")
    private Long maxTokenValue;
    @Value("${gendox.agents.temperature}")
    private Double temperatureValue;
    @Value("${gendox.agents.top_p}")
    private Double topPValue;

    private ProjectAgentRepository projectAgentRepository;
    private TypeService typeService;
    private TemplateRepository templateRepository;
    private UserService userService;

    private AiModelRepository aiModelRepository;

    @Autowired
    public ProjectAgentService(ProjectAgentRepository projectAgentRepository,
                               TypeService typeService,
                               TemplateRepository templateRepository,
                               UserService userService,
                               AiModelRepository aiModelRepository) {
        this.projectAgentRepository = projectAgentRepository;
        this.typeService = typeService;
        this.templateRepository = templateRepository;
        this.userService = userService;
        this.aiModelRepository = aiModelRepository;

    }

    public ProjectAgent getAgentByProjectId(UUID projectId){
        return projectAgentRepository.findByProjectId(projectId);
    }

    public ProjectAgent getAgentByDocumentId(UUID documentId){
        return projectAgentRepository.findAgentByDocumentInstanceId(documentId)
                .orElse(null);
    }

    public ProjectAgent createProjectAgent(ProjectAgent projectAgent) throws Exception {
        if (projectAgent.getId() != null) {
            throw new GendoxException("NEW_PROJECT_AGENT_ID_IS_NOT_NULL", "Project - Agent id must be null", HttpStatus.BAD_REQUEST);

        }

        if (projectAgent.getChatTemplateId() == null) {
            projectAgent.setChatTemplateId(templateRepository.findIdByIsDefaultTrueAndTemplateTypeName("CHAT_TEMPLATE"));
        }
        if (projectAgent.getSectionTemplateId() == null) {
            projectAgent.setSectionTemplateId(templateRepository.findIdByIsDefaultTrueAndTemplateTypeName("SECTION_TEMPLATE"));
        }
        if (projectAgent.getDocumentSplitterType() == null) {
            projectAgent.setDocumentSplitterType(typeService.getDocumentSplitterTypeByName(splitterTypeName));
        }
        if (projectAgent.getMaxToken() == null) {
            projectAgent.setMaxToken(maxTokenValue);
        }

        if (projectAgent.getTemperature() == null) {
            projectAgent.setTemperature(temperatureValue);
        }

        if (projectAgent.getTopP() == null) {
            projectAgent.setTopP(topPValue);
        }


        // Enable Agent to become User
        User user = new User();
        user.setName(projectAgent.getAgentName());
        user.setUserName(projectAgent.getAgentName());
        user.setUserType(typeService.getUserTypeByName(UserNamesConstants.GENDOX_AGENT));
        user.setId(UUID.randomUUID());
        user = userService.createUser(user);

        projectAgent.setUserId(user.getId());
        projectAgent = projectAgentRepository.save(projectAgent);

        return projectAgent;
    }


    public ProjectAgent updateProjectAgent(ProjectAgent projectAgent) throws GendoxException {
        UUID projectAgentId = projectAgent.getId();
        ProjectAgent existingProjectAgent = projectAgentRepository.getById(projectAgentId);

        // Update the properties         existingProjectAgent.setCompletionModelId(aiModelRepo.findByName(projectAgent.getCompletionModelId().getName()));
        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setCompletionModel(aiModelRepository.findByName(projectAgent.getCompletionModel().getName()));
        existingProjectAgent.setSemanticSearchModel(aiModelRepository.findByName(projectAgent.getSemanticSearchModel().getName()));
        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setAgentBehavior(projectAgent.getAgentBehavior());
        existingProjectAgent.setPrivateAgent(projectAgent.getPrivateAgent());
        existingProjectAgent.setCreatedAt(projectAgent.getCreatedAt());

        existingProjectAgent = projectAgentRepository.save(existingProjectAgent);
        return existingProjectAgent;
    }


}



























package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectAgentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectAgentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

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

    private AiModelService aiModelService;

    private AuthenticationService authenticationService;


    @Autowired
    public ProjectAgentService(AuthenticationService authenticationService,
                               ProjectAgentRepository projectAgentRepository,
                               TypeService typeService,
                               TemplateRepository templateRepository,
                               @Lazy UserService userService,
                               AiModelRepository aiModelRepository,
                               AiModelService aiModelService) {
        this.authenticationService = authenticationService;
        this.projectAgentRepository = projectAgentRepository;
        this.typeService = typeService;
        this.templateRepository = templateRepository;
        this.userService = userService;
        this.aiModelRepository = aiModelRepository;
        this.aiModelService = aiModelService;
    }

    public ProjectAgent getAgentByProjectId(UUID projectId) {
        return projectAgentRepository.findByProjectId(projectId);
    }

    public ProjectAgent getAgentByDocumentId(UUID documentId) {
        return projectAgentRepository.findAgentByDocumentInstanceId(documentId)
                .orElse(null);
    }

    public Page<ProjectAgent> getAllProjectAgents(ProjectAgentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return projectAgentRepository.findAll(ProjectAgentPredicates.build(criteria), pageable);
    }

    public ProjectAgent createProjectAgent(ProjectAgent projectAgent) throws Exception {
        if (projectAgent.getId() != null) {
            throw new GendoxException("NEW_PROJECT_AGENT_ID_IS_NOT_NULL", "Project - Agent id must be null", HttpStatus.BAD_REQUEST);
        }
        if (projectAgent.getProject() == null) {
            throw new GendoxException("PROJECT_AGENT_PROJECT_NULL", "Agent must be linked with a project, project must not be null", HttpStatus.BAD_REQUEST);
        }

        populateAgentDefaultValues(projectAgent);


        // Enable Agent to become User
        User user = new User();
        user.setName(projectAgent.getAgentName());
        user.setUserName(projectAgent.getAgentName());
        user.setUserType(typeService.getUserTypeByName(UserNamesConstants.GENDOX_AGENT));
        // TODO: this is just a Hack... Use Keycloak Attributes when the Gendox's Keycloak Service starts support attributes .
        //  So the Agent's surname is set to 'GENDOX_AGENT' for now
        user.setLastName(UserNamesConstants.GENDOX_AGENT);

        String agentIdpId = authenticationService.createUser(user, null, true, false);

        user.setId(UUID.fromString(agentIdpId));
        user = userService.createUser(user);

        projectAgent.setUserId(user.getId());
        projectAgent = projectAgentRepository.save(projectAgent);

        return projectAgent;
    }

    private void populateAgentDefaultValues(ProjectAgent projectAgent) {
        // it is possible to have a project that has only id, without name.
        // unlikely to happen, add this exception to figure out the root cause, instead of silently creating an agent with empty name
        if (projectAgent.getProject().getName() == null) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AGENT_NAME_MUST_NOT_BE_EMPTY", "Agent name must not be empty");
        }
        projectAgent.setAgentName(projectAgent.getProject().getName() + " Agent");

        if (projectAgent.getAgentBehavior() == null) {
            projectAgent.setAgentBehavior("You are a Gendox Agent. A helpful AI assistant. " +
                    "Users can train you on their private data to help them with their tasks. " +
                    "Users can go to 'Project setting' -> 'Agent' -> 'behavior' to change the role and purpose of you!");
        }
        if (projectAgent.getPrivateAgent() == null) {
            projectAgent.setPrivateAgent(true);
        }
        if (projectAgent.getSemanticSearchModel() == null) {
            projectAgent.setSemanticSearchModel(aiModelService.getByName(AiModelConstants.ADA_3_SMALL));
        }
        if (projectAgent.getCompletionModel() == null) {
            projectAgent.setCompletionModel(aiModelService.getByName(AiModelConstants.GPT_3_5_TURBO_MODEL));
        }
        if (projectAgent.getModerationModel() == null) {
            projectAgent.setModerationModel(aiModelRepository.findByName(AiModelConstants.OPEN_AI_MODERATION));
        }
        if (projectAgent.getModerationCheck() == null) {
            projectAgent.setModerationCheck(true);
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
        existingProjectAgent.setCreatedBy(projectAgent.getCreatedBy());
        existingProjectAgent.setMaxToken(projectAgent.getMaxToken());
        existingProjectAgent.setTemperature(projectAgent.getTemperature());
        existingProjectAgent.setTopP(projectAgent.getTopP());
        existingProjectAgent.setModerationCheck(projectAgent.getModerationCheck());
        if (projectAgent.getModerationModel() != null && projectAgent.getModerationCheck()) {
            existingProjectAgent.setModerationModel(aiModelRepository.findByName(projectAgent.getModerationModel().getName()));
        }
        existingProjectAgent = projectAgentRepository.save(existingProjectAgent);
        return existingProjectAgent;
    }


}



























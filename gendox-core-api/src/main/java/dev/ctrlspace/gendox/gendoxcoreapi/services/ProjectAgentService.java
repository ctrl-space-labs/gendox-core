package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.nimbusds.jose.crypto.opts.UserAuthenticationRequired;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProjectAgentService {


    @Value("${gendox.agents.splitter-type}")
    private String splitterTypeName;

    private ProjectAgentRepository projectAgentRepository;
    private UserRepository userRepository;
    private JWTUtils jwtUtils;
    private TypeService typeService;
    private TemplateRepository templateRepository;

    @Autowired
    public ProjectAgentService(ProjectAgentRepository projectAgentRepository,
                               UserRepository userRepository,
                               JWTUtils jwtUtils,
                               TypeService typeService,
                               TemplateRepository templateRepository) {
        this.projectAgentRepository = projectAgentRepository;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.typeService = typeService;
        this.templateRepository = templateRepository;
    }

    public ProjectAgent createProjectAgent(ProjectAgent projectAgent) throws Exception {
        Instant now = Instant.now();

        if (projectAgent.getId() != null) {
            throw new GendoxException("NEW_PROJECT_AGENT_ID_IS_NOT_NULL", "Project - Agent id must be null", HttpStatus.BAD_REQUEST);

        }

        projectAgent.setCreatedAt(now);
        projectAgent.setUpdatedAt(now);
        projectAgent.setCreatedBy(getUserId());
        projectAgent.setUpdatedBy(getUserId());
        if (projectAgent.getChatTemplateId() == null) {
            projectAgent.setChatTemplateId(templateRepository.findIdByIsDefaultTrueAndTemplateTypeName("CHAT_TEMPLATE"));
        }
        if (projectAgent.getSectionTemplateId() == null) {
            projectAgent.setSectionTemplateId(templateRepository.findIdByIsDefaultTrueAndTemplateTypeName("SECTION_TEMPLATE"));
        }
        if (projectAgent.getDocumentSplitterType() == null) {
            projectAgent.setDocumentSplitterType(typeService.getDocumentSplitterTypeByName(splitterTypeName));
        }
        projectAgent = projectAgentRepository.save(projectAgent);

        return projectAgent;
    }


    public ProjectAgent updateProjectAgent(ProjectAgent projectAgent) throws GendoxException {
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

    public UUID getUserId() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<User> user = userRepository.findByName("Discord");
            return user.get().getId();
        } else {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());
            return UUID.fromString(jwtDTO.getUserId());
        }
    }
}



























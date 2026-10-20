package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.authentication.AuthenticationService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectAgentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ProjectAgentPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillMarkdownParser;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import dev.ctrlspace.provenai.ssi.issuer.VerifiablePresentationBuilder;
import id.walt.crypto.keys.jwk.JWKKey;
import jakarta.annotation.Nullable;
import kotlinx.serialization.json.Json;
import kotlinx.serialization.json.JsonPrimitive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    @Value("${gendox.agents.max_search_limit}")
    private Long maxSearchLimit;
    @Value("${gendox.agents.max_completion_limit}")
    private Long maxCompletionLimit;

    private ProjectAgentRepository projectAgentRepository;
    private TypeService typeService;
    private TemplateRepository templateRepository;
    private UserService userService;
    private SubscriptionAiModelTierService subscriptionAiModelTierService;
    private CryptographyUtils cryptographyUtils;
    private AiModelService aiModelService;
    private AuthenticationService authenticationService;
    private OrganizationPlanService organizationPlanService;

    private AiToolsRepository aiToolsRepository;
    private SkillService skillService;


    @Autowired
    public ProjectAgentService(AuthenticationService authenticationService,
                               ProjectAgentRepository projectAgentRepository,
                               TypeService typeService,
                               TemplateRepository templateRepository,
                               @Lazy UserService userService,
                               AiModelService aiModelService,
                               CryptographyUtils cryptographyUtils,
                               SubscriptionAiModelTierService subscriptionAiModelTierService,
                               OrganizationPlanService organizationPlanService,
                               AiToolsRepository aiToolsRepository,
                               SkillService skillService

    ) {
        this.authenticationService = authenticationService;
        this.projectAgentRepository = projectAgentRepository;
        this.typeService = typeService;
        this.templateRepository = templateRepository;
        this.userService = userService;
        this.aiModelService = aiModelService;
        this.cryptographyUtils = cryptographyUtils;
        this.subscriptionAiModelTierService = subscriptionAiModelTierService;
        this.organizationPlanService = organizationPlanService;
        this.aiToolsRepository = aiToolsRepository;
        this.skillService = skillService;
    }

    public ProjectAgent getAgentByProjectId(UUID projectId) {
        return projectAgentRepository.findByProjectId(projectId);
    }

    public Boolean isPublicAgent(UUID projectId) {
        return projectAgentRepository.existsByProjectIdAndPrivateAgentIsFalse(projectId);
    }

    /**
     *  Gets the agent that the Document is connected to.
     *  * It first check in project documents
     *  * and then in chat thread documents
     *
     * @param documentId
     * @return
     */
    public @Nullable ProjectAgent getAgentByDocumentId(UUID documentId) {
        Optional<ProjectAgent> projectDocumentsAgent = projectAgentRepository.findAgentByProjectDocumentInstanceId(documentId);
        if (projectDocumentsAgent.isPresent()) {
            return projectDocumentsAgent.get();
        }

        Optional<ProjectAgent> chatThreadDocumentsAgent = projectAgentRepository.findAgentByChatThreadDocumentInstanceId(documentId);

        return chatThreadDocumentsAgent.orElse(null);
    }

    public ProjectAgent getAgentById(UUID agentId) {
        return projectAgentRepository.findById(agentId).orElse(null);
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
        // ensure uniqueness of Agent username
        user.setUserName(projectAgent.getAgentName().toLowerCase() + "-" + UUID.randomUUID());
        // remove whitespaces from username
        user.setUserName(user.getUserName().replaceAll("\\s+", ""));

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

    private void populateAgentDefaultValues(ProjectAgent projectAgent) throws GendoxException {
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
            projectAgent.setSemanticSearchModel(aiModelService.getByName(AiModelConstants.VOYAGE_4_LITE));
        }
        if (projectAgent.getCompletionModel() == null) {
            projectAgent.setCompletionModel(aiModelService.getByName(AiModelConstants.GPT_6_LUNA));
        }
        if (projectAgent.getDecisionModel() == null) {
            projectAgent.setDecisionModel(aiModelService.getByName(AiModelConstants.JEV_LATEST));
        }
        if (projectAgent.getModerationModel() == null) {
            projectAgent.setModerationModel(aiModelService.getByName(AiModelConstants.OMNI_MODERATION));
        }
        if (projectAgent.getRerankModel() == null) {
            projectAgent.setRerankModel(aiModelService.getByName(AiModelConstants.VOYAGE_RERANK_3_LITE));
        }
        if (projectAgent.getAdvancedSearchModel() == null) {
            projectAgent.setAdvancedSearchModel(aiModelService.getByName(AiModelConstants.GPT_6_LUNA));
        }
        if (projectAgent.getModerationCheck() == null) {
            projectAgent.setModerationCheck(false);
        }
        if (projectAgent.getRerankEnable() == null) {
            projectAgent.setRerankEnable(false);
        }
        if (projectAgent.getAdvancedSearchEnable() == null) {
            projectAgent.setAdvancedSearchEnable(false);
        }
        if (projectAgent.getAdvancedSearchMode() == null) {
            projectAgent.setAdvancedSearchMode("ALWAYS");
        }
        validateAdvancedSearchMode(projectAgent.getAdvancedSearchMode());
        if (projectAgent.getAutoDigitization() == null) {
            projectAgent.setAutoDigitization(false);
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
        if (projectAgent.getMaxSearchLimit() == null) {
            projectAgent.setMaxSearchLimit(maxSearchLimit);
        }
        if (projectAgent.getMaxCompletionLimit() == null) {
            projectAgent.setMaxCompletionLimit(maxCompletionLimit);
        }


    }


    public ProjectAgent updateProjectAgent(ProjectAgent projectAgent) throws GendoxException {
        UUID projectAgentId = projectAgent.getId();
        ProjectAgent existingProjectAgent = projectAgentRepository.getById(projectAgentId);

        // Update the properties
        AiModel completionModel = aiModelService.getByName(projectAgent.getCompletionModel().getName());
        AiModel decisionModel = aiModelService.getByName(projectAgent.getDecisionModel().getName());
        AiModel semanticSearchModel = aiModelService.getByName(projectAgent.getSemanticSearchModel().getName());
        AiModel moderationModel = aiModelService.getByName(projectAgent.getModerationModel().getName());
        AiModel rerankModel = aiModelService.getByName(projectAgent.getRerankModel().getName());
        AiModel advancedSearchModel = aiModelService.getByName(projectAgent.getAdvancedSearchModel().getName());

        UUID subscriptionPlanId = organizationPlanService
                .getActiveOrganizationPlan(existingProjectAgent.getProject().getOrganizationId())
                .getSubscriptionPlan()
                .getId();

        if (!completionModel.getIsActive()) {
            throw new GendoxException("INACTIVE_COMPLETION_MODEL", "The selected completion model is inactive", HttpStatus.FORBIDDEN);
        }

        if (!semanticSearchModel.getIsActive()) {
            throw new GendoxException("INACTIVE_SEMANTIC_SEARCH_MODEL", "The selected semantic search model is inactive", HttpStatus.FORBIDDEN);
        }

        if (!decisionModel.getIsActive()) {
            throw new GendoxException("INACTIVE_DECISION_MODEL", "The selected decision model is inactive", HttpStatus.FORBIDDEN);
        }

        if (!subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, completionModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_COMPLETION_MODEL",
                    "No access to the completion model. Basic or Pro subscription is required",
                    HttpStatus.FORBIDDEN);
        }

        if (!subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, semanticSearchModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_SEMANTIC_SEARCH_MODEL",
                    "No access to the semantic search model. Basic or Pro subscription is required",
                    HttpStatus.FORBIDDEN);
        }

        if (!subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, decisionModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_DECISION_MODEL",
                    "No access to the decision model for this subscription",
                    HttpStatus.FORBIDDEN);
        }

        if (!subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, moderationModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_MODERATION_MODEL",
                    "No access to the moderation model. Basic or Pro subscription is required",
                    HttpStatus.FORBIDDEN);
        }

        if (projectAgent.getRerankEnable() && !subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, rerankModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_RERANK_MODEL",
                    "No access to the rerank model. Basic or Pro subscription is required",
                    HttpStatus.FORBIDDEN);
        }

        if (projectAgent.getAdvancedSearchEnable() && !subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, advancedSearchModel.getModelTierType().getId())) {
            throw new GendoxException("NO_ACCESS_TO_ADVANCED_SEARCH_MODEL",
                    "No access to the advanced search model. Basic or Pro subscription is required",
                    HttpStatus.FORBIDDEN);
        }

        if (Boolean.TRUE.equals(projectAgent.getAutoDigitization())) {
            Type standardTier = typeService.getByCategoryAndName("MODEL_TIER", "STANDARD_MODEL");
            if (!subscriptionAiModelTierService.hasAccessToModelTier(subscriptionPlanId, standardTier.getId())) {
                throw new GendoxException("NO_ACCESS_TO_AUTO_DIGITIZATION",
                        "Advanced Digitization requires Basic or Pro subscription",
                        HttpStatus.FORBIDDEN);
            }
        }

        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setCompletionModel(completionModel);
        existingProjectAgent.setDecisionModel(decisionModel);
        existingProjectAgent.setSemanticSearchModel(semanticSearchModel);
        existingProjectAgent.setAgentName(projectAgent.getAgentName());
        existingProjectAgent.setAgentBehavior(projectAgent.getAgentBehavior());
        existingProjectAgent.setPrivateAgent(projectAgent.getPrivateAgent());
        existingProjectAgent.setCreatedAt(projectAgent.getCreatedAt());
        existingProjectAgent.setCreatedBy(projectAgent.getCreatedBy());
        existingProjectAgent.setMaxToken(projectAgent.getMaxToken());
        existingProjectAgent.setReasoningEffort(projectAgent.getReasoningEffort());
        existingProjectAgent.setTemperature(projectAgent.getTemperature());
        existingProjectAgent.setTopP(projectAgent.getTopP());
        existingProjectAgent.setDocumentSplitterType(projectAgent.getDocumentSplitterType());
        existingProjectAgent.setMaxSearchLimit(projectAgent.getMaxSearchLimit());
        existingProjectAgent.setMaxCompletionLimit(projectAgent.getMaxCompletionLimit());
        existingProjectAgent.setModerationCheck(projectAgent.getModerationCheck());
        if (projectAgent.getModerationModel() != null && projectAgent.getModerationCheck()) {
            existingProjectAgent.setModerationModel(aiModelService.getByName(projectAgent.getModerationModel().getName()));
        }
        existingProjectAgent.setRerankEnable(projectAgent.getRerankEnable());
        if (projectAgent.getRerankModel() != null && projectAgent.getRerankEnable()) {
            existingProjectAgent.setRerankModel(aiModelService.getByName(projectAgent.getRerankModel().getName()));
        }
        existingProjectAgent.setAdvancedSearchEnable(projectAgent.getAdvancedSearchEnable());
        if (projectAgent.getAdvancedSearchModel() != null && projectAgent.getAdvancedSearchEnable()) {
            existingProjectAgent.setAdvancedSearchModel(aiModelService.getByName(projectAgent.getAdvancedSearchModel().getName()));
        }
        if (projectAgent.getAdvancedSearchMode() != null) {
            validateAdvancedSearchMode(projectAgent.getAdvancedSearchMode());
            existingProjectAgent.setAdvancedSearchMode(projectAgent.getAdvancedSearchMode());
        }
        if (projectAgent.getAutoDigitization() != null) {
            existingProjectAgent.setAutoDigitization(projectAgent.getAutoDigitization());
        }
        existingProjectAgent.setOrganizationDid(projectAgent.getOrganizationDid());


        syncAiTools(projectAgent, existingProjectAgent);
        syncAgentSkills(projectAgent, existingProjectAgent);

        existingProjectAgent = projectAgentRepository.save(existingProjectAgent);
        return existingProjectAgent;
    }

    private void validateAdvancedSearchMode(String mode) {
        if (!Set.of("ALWAYS", "AUTO", "OFF").contains(mode)) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "INVALID_ADVANCED_SEARCH_MODE", "Advanced search mode must be ALWAYS, AUTO or OFF");
        }
    }

    /**
     * Sync AI-Tools between the incoming ProjectAgent (source) and the
     * already-persisted ProjectAgent (target).
     *
     * 1. Update tools whose id exists on both sides.
     * 2. Remove tools that exist only on target.
     * 3. Add tools that exist only on source (id == null *or* id not on target).
     */
    private void syncAiTools(ProjectAgent source, ProjectAgent target) {

        List<AiTools> incomingTools = source.getAiTools();

        Map<UUID, AiTools> currentToolsById = target.getAiTools().stream()
                .collect(Collectors.toMap(AiTools::getId, Function.identity()));

        Set<UUID> keepIds = new HashSet<>();

        for (AiTools incTool : incomingTools) {
            if (incTool.getExecution() == null) {
                incTool.setExecution("ACTION");
            }
            if (!Set.of("ACTION", "CLIENT").contains(incTool.getExecution())) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "INVALID_TOOL_EXECUTION", "Tool execution must be ACTION or CLIENT");
            }
            UUID id = incTool.getId();

            if (id != null && currentToolsById.containsKey(id)) {
                // update existing
                AiTools managed = currentToolsById.get(id);
                managed.setJsonSchema(incTool.getJsonSchema());
                managed.setExecution(incTool.getExecution());

                keepIds.add(id);
            } else {
                incTool.setAgent(target);
                incTool.setType("function");
                target.getAiTools().add(incTool);
            }
        }

        target.getAiTools().removeIf(t -> {
            UUID id = t.getId();
            return id != null && !keepIds.contains(id);
        });
    }


    /**
     * Sync the skills between the incoming ProjectAgent (source) and the persisted one (target),
     * the same way {@link #syncAiTools} does for tools. A null list leaves the skills as they are.
     *
     * <ul>
     *   <li>A copy of a Gendox skill ({@code skillId} set) is read-only; it changes only when Gendox
     *       publishes a new version.</li>
     *   <li>A new row with a {@code skillId} is copied from the catalog on the server; the content the
     *       client sent is ignored.</li>
     *   <li>A skill the user wrote is re-read from its SKILL.md, so name and description always
     *       match the front matter.</li>
     * </ul>
     */
    // package-private for tests
    void syncAgentSkills(ProjectAgent source, ProjectAgent target) throws GendoxException {
        List<AgentSkill> incomingSkills = source.getAgentSkills();
        if (incomingSkills == null) {
            return;
        }

        Map<UUID, AgentSkill> currentById = target.getAgentSkills().stream()
                .collect(Collectors.toMap(AgentSkill::getId, Function.identity()));
        Set<UUID> keepIds = new HashSet<>();
        List<AgentSkill> added = new ArrayList<>();

        for (AgentSkill incoming : incomingSkills) {
            UUID id = incoming.getId();
            AgentSkill managed = id != null ? currentById.get(id) : null;

            if (managed != null) {
                keepIds.add(id);
                if (managed.getSkillId() != null) {
                    if (incoming.getContent() != null && !incoming.getContent().equals(managed.getContent())) {
                        throw new GendoxException("SKILL_READ_ONLY",
                                "The Gendox skill " + managed.getName() + " can't be edited. Edit a copy instead.",
                                HttpStatus.BAD_REQUEST);
                    }
                    continue;
                }
                SkillMarkdownParser.ParsedSkill parsed = skillService.parse(incoming.getContent());
                managed.setName(parsed.name());
                managed.setDescription(parsed.description());
                managed.setContent(parsed.content());
                continue;
            }

            AgentSkill created;
            if (incoming.getSkillId() != null) {
                var librarySkill = skillService.getLibrarySkillById(incoming.getSkillId());
                created = AgentSkill.builder()
                        .skillId(librarySkill.getId())
                        .name(librarySkill.getName())
                        .description(librarySkill.getDescription())
                        .content(librarySkill.getContent())
                        .build();
            } else {
                SkillMarkdownParser.ParsedSkill parsed = skillService.parse(incoming.getContent());
                created = AgentSkill.builder()
                        .name(parsed.name())
                        .description(parsed.description())
                        .content(parsed.content())
                        .build();
            }
            created.setAgent(target);
            added.add(created);
        }

        target.getAgentSkills().removeIf(s -> s.getId() != null && !keepIds.contains(s.getId()));
        target.getAgentSkills().addAll(added);

        Set<String> names = new HashSet<>();
        for (AgentSkill skill : target.getAgentSkills()) {
            if (!names.add(skill.getName())) {
                throw new GendoxException("SKILL_NAME_DUPLICATE",
                        "This agent already has a skill named " + skill.getName(), HttpStatus.BAD_REQUEST);
            }
        }
    }


    public Object createVerifiablePresentation(ProjectAgent projectAgent, String subjectKeyJwk, String subjectDid) throws GendoxException, IOException {

        JsonPrimitive agentVcJwtPrimitive = Json.Default.decodeFromString(JsonPrimitive.Companion.serializer(), projectAgent.getAgentVcJwt());
        VerifiablePresentationBuilder verifiablePresentationBuilder = new VerifiablePresentationBuilder();
        verifiablePresentationBuilder.addCredential(agentVcJwtPrimitive);
        verifiablePresentationBuilder.setPresentationId();
        verifiablePresentationBuilder.setDid(subjectDid);
        verifiablePresentationBuilder.setNonce(cryptographyUtils.generateNonce());

        JWKKey jwkKey = new JWKKey(subjectKeyJwk);

        return verifiablePresentationBuilder.buildAndSign(jwkKey);

    }

    public Object createVerifiablePresentationOrg(String vcJwt, String subjectKeyJwk, String subjectDid) throws
            GendoxException, IOException {

        JsonPrimitive agentVcJwtPrimitive = Json.Default.decodeFromString(JsonPrimitive.Companion.serializer(), vcJwt);
        VerifiablePresentationBuilder verifiablePresentationBuilder = new VerifiablePresentationBuilder();
        verifiablePresentationBuilder.addCredential(agentVcJwtPrimitive);
        verifiablePresentationBuilder.setPresentationId();
        verifiablePresentationBuilder.setDid(subjectDid);
        verifiablePresentationBuilder.setNonce(cryptographyUtils.generateNonce());

        JWKKey jwkKey = new JWKKey(subjectKeyJwk);


        return verifiablePresentationBuilder.buildAndSign(jwkKey);


    }


}
























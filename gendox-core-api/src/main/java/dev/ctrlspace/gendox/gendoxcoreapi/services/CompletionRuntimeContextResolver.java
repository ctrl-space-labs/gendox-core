package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import org.apache.logging.log4j.util.Strings;
import org.jetbrains.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Works out what one completion runs with: the agent's settings, replaced by whatever the caller
 * overrides, plus the skills and their tools. A caller without a project has to give every value.
 */
@Service
public class CompletionRuntimeContextResolver {

    private final Logger logger = LoggerFactory.getLogger(CompletionRuntimeContextResolver.class);

    private final TemplateRepository templateRepository;
    private final TypeService typeService;
    private final EmbeddingService embeddingService;
    private final DocumentUtils documentUtils;
    private final ObjectMapper objectMapper;
    private final AiModelService aiModelService;
    private final AiToolRegistry aiToolRegistry;
    private final SkillService skillService;

    public CompletionRuntimeContextResolver(TemplateRepository templateRepository,
                                            TypeService typeService,
                                            EmbeddingService embeddingService,
                                            DocumentUtils documentUtils,
                                            ObjectMapper objectMapper,
                                            AiModelService aiModelService,
                                            AiToolRegistry aiToolRegistry,
                                            SkillService skillService) {
        this.templateRepository = templateRepository;
        this.typeService = typeService;
        this.embeddingService = embeddingService;
        this.documentUtils = documentUtils;
        this.objectMapper = objectMapper;
        this.aiModelService = aiModelService;
        this.aiToolRegistry = aiToolRegistry;
        this.skillService = skillService;
    }

    public CompletionRuntimeContext resolve(Message message,
                                            List<DocumentInstanceSectionDTO> nearestSections,
                                            @Nullable Project project,
                                            @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        ProjectAgent agent = Optional.ofNullable(project)
                .map(Project::getProjectAgent)
                .orElse(null);

        List<AgentSkill> agentSkills = skillsFor(agent, message, overrides);

        String question = resolveQuestion(message, nearestSections, agent);
        String agentRole = appendInstructions(appendSkillsHeader(resolveSystemPrompt(agent, overrides), agentSkills), overrides);
        AiModel completionModel = resolveCompletionModel(agent, overrides);
        String completionApiKey = resolveCompletionApiKey(agent, overrides);
        Long maxTokens = resolveMaxTokens(agent, overrides);
        Double temperature = resolveTemperature(agent, overrides);
        Double topP = resolveTopP(agent, overrides);
        UUID projectId = resolveProjectId(project, overrides);
        UUID organizationId = resolveOrganizationId(project, overrides);
        UUID createdByAgentUserId = resolveCreatedByAgentUserId(agent, overrides);
        List<AiTools> availableTools = resolveAvailableTools(agent, overrides, agentSkills);

        AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(maxTokens)
                .temperature(temperature)
                .topP(topP)
                .reasoningEffort(resolveReasoningEffort(agent, overrides))
                .build();

        CancellationToken cancellationToken = Optional.ofNullable(overrides)
                .map(CompletionRuntimeOverridesDTO::getCancellationToken)
                .orElse(null);

        return new CompletionRuntimeContext(
                project,
                agent,
                question,
                agentRole,
                completionModel,
                completionApiKey,
                aiModelRequestParams,
                availableTools,
                projectId,
                organizationId,
                createdByAgentUserId,
                cancellationToken
        );
    }

    private String resolveQuestion(Message message,
                                   List<DocumentInstanceSectionDTO> nearestSections,
                                   @Nullable ProjectAgent agent) throws GendoxException {
        if (agent == null) {
            return message.getValue();
        }
        // TODO add text of attached documents in the message
        return convertToAiModelTextQuestion(message, nearestSections, agent);
    }

    private UUID resolveProjectId(@Nullable Project project,
                                   @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (project != null) return project.getId();
        if (overrides != null && overrides.getProjectId() != null) return overrides.getProjectId();
        throw missingOverrideException("projectId");
    }

    private UUID resolveOrganizationId(@Nullable Project project,
                                        @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (project != null) return project.getOrganizationId();
        if (overrides != null && overrides.getOrganizationId() != null) return overrides.getOrganizationId();
        throw missingOverrideException("organizationId");
    }

    private UUID resolveCreatedByAgentUserId(@Nullable ProjectAgent agent,
                                             @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (agent != null && agent.getUserId() != null) return agent.getUserId();
        if (overrides != null && overrides.getCreatedByAgentUserId() != null) return overrides.getCreatedByAgentUserId();
        throw missingOverrideException("createdByAgentUserId");
    }

    // package-private for tests
    List<AiTools> resolveAvailableTools(@Nullable ProjectAgent agent,
                                                 @Nullable CompletionRuntimeOverridesDTO overrides,
                                                 List<AgentSkill> agentSkills) {
        List<AiTools> tools;
        if (overrides != null && overrides.getAiTools() != null && !overrides.getAiTools().isEmpty()) {
            tools = overrides.getAiTools();
        } else if (agent != null) {
            tools = agent.getAiTools();
        } else {
            return Collections.emptyList();
        }

        tools = withSkillTools(tools, agentSkills);

        List<String> excluded = overrides != null ? overrides.getExcludedToolNames() : Collections.emptyList();
        if (excluded == null || excluded.isEmpty()) {
            return tools;
        }

        return tools.stream()
                .filter(tool -> {
                    String name = toolName(tool);
                    return name == null || !excluded.contains(name);
                })
                .collect(Collectors.toList());
    }

    /** The function name in a tool's JSON schema, or null when the schema can't be read. */
    public String toolName(AiTools tool) {
        try {
            return objectMapper.readTree(tool.getJsonSchema()).path("name").asText();
        } catch (JsonProcessingException e) {
            logger.warn("Could not parse tool JSON schema; keeping tool. Error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * An agent with skills also gets read_skill and the tools its skills list in {@code allowed-tools},
     * each defined by its AI_TOOL_EXAMPLES row. None of them is stored on the agent: they are here only while a skill brings them, and an agent
     * tool of the same name wins. Never changes the agent's own (managed) list.
     */
    private List<AiTools> withSkillTools(List<AiTools> tools, List<AgentSkill> agentSkills) {
        List<String> skillToolNames = skillService.chatToolNames(agentSkills);
        if (skillToolNames.isEmpty()) {
            return tools;
        }
        Set<String> agentToolNames = tools.stream().map(this::toolName).collect(Collectors.toSet());
        Map<String, JsonNode> examples = typeService.getToolExampleDefinitions();
        List<AiTools> withSkillTools = new ArrayList<>(tools);
        for (String name : skillToolNames) {
            if (agentToolNames.contains(name)) {
                continue;
            }
            // the tool's example row, as the agent's own tools get it; read_skill has none
            Optional<String> definition = examples.containsKey(name)
                    ? Optional.of(examples.get(name).toString())
                    : aiToolRegistry.getDefinition(name);
            definition.ifPresent(json -> withSkillTools.add(AiTools.builder()
                    .type("function")
                    .jsonSchema(json)
                    .build()));
        }
        return withSkillTools;
    }

    private static boolean hasSystemPromptOverride(@Nullable CompletionRuntimeOverridesDTO overrides) {
        return overrides != null && overrides.getSystemPrompt() != null && !overrides.getSystemPrompt().isBlank();
    }

    /**
     * The skills a completion gets: every skill of the agent, in chats and task runs alike, plus the
     * Gendox assistant skill for a chat from a Gendox page. A caller that replaces the system prompt
     * (a sub-agent) speaks as someone else and gets none.
     */
    // package-private for tests
    List<AgentSkill> skillsFor(@Nullable ProjectAgent agent, Message prompt, @Nullable CompletionRuntimeOverridesDTO overrides) {
        if (agent == null || hasSystemPromptOverride(overrides)) {
            return List.of();
        }
        return skillService.getCompletionSkills(agent.getId(), prompt);
    }

    /**
     * The skills header goes at the end of the system prompt, never into a message: the system
     * prompt is sent with every request anyway, and an unchanged header keeps the prefix cacheable.
     */
    // package-private for tests
    String appendSkillsHeader(String systemPrompt, List<AgentSkill> agentSkills) {
        String header = skillService.buildSkillsHeader(agentSkills);
        if (header == null) {
            return systemPrompt;
        }
        return systemPrompt + "\n\n" + header;
    }

    // Fixed text after the system prompt, so it stays in the cacheable prefix too
    private static String appendInstructions(String systemPrompt, @Nullable CompletionRuntimeOverridesDTO overrides) {
        if (overrides == null || overrides.getInstructions() == null) {
            return systemPrompt;
        }
        return systemPrompt + "\n\n" + overrides.getInstructions();
    }

    private String resolveSystemPrompt(@Nullable ProjectAgent agent,
                                       @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getSystemPrompt() != null && !overrides.getSystemPrompt().isBlank()) {
            return overrides.getSystemPrompt();
        }
        if (agent != null && agent.getAgentBehavior() != null) {
            return agent.getAgentBehavior();
        }
        throw missingOverrideException("systemPrompt");
    }

    private AiModel resolveCompletionModel(@Nullable ProjectAgent agent,
                                           @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getCompletionModelName() != null && !overrides.getCompletionModelName().isBlank()) {
            return aiModelService.getByName(overrides.getCompletionModelName());
        }
        if (agent != null && agent.getCompletionModel() != null) {
            return agent.getCompletionModel();
        }
        throw missingOverrideException("completionModelName");
    }

    private String resolveCompletionApiKey(@Nullable ProjectAgent agent,
                                           @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getCompletionApiKey() != null && !overrides.getCompletionApiKey().isBlank()) {
            return overrides.getCompletionApiKey();
        }
        AiModel completionModel = resolveCompletionModel(agent, overrides);
        UUID organizationId = resolveOrganizationId(
                agent != null ? agent.getProject() : null, overrides);
        return embeddingService.getApiKey(organizationId, completionModel);
    }

    private Long resolveMaxTokens(@Nullable ProjectAgent agent,
                                  @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getMaxTokens() != null) {
            return overrides.getMaxTokens();
        }
        if (agent != null && agent.getMaxToken() != null) {
            return agent.getMaxToken();
        }
        throw missingOverrideException("maxTokens");
    }

    private Double resolveTemperature(@Nullable ProjectAgent agent,
                                      @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getTemperature() != null) {
            return overrides.getTemperature();
        }
        if (agent != null && agent.getTemperature() != null) {
            return agent.getTemperature();
        }
        throw missingOverrideException("temperature");
    }

    private Double resolveTopP(@Nullable ProjectAgent agent,
                               @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        if (overrides != null && overrides.getTopP() != null) {
            return overrides.getTopP();
        }
        if (agent != null && agent.getTopP() != null) {
            return agent.getTopP();
        }
        throw missingOverrideException("topP");
    }

    /** Optional, unlike the other params: null means "use the model's default". */
    @Nullable
    private String resolveReasoningEffort(@Nullable ProjectAgent agent,
                                          @Nullable CompletionRuntimeOverridesDTO overrides) {
        if (overrides != null && overrides.getReasoningEffort() != null) {
            return overrides.getReasoningEffort();
        }
        if (agent != null && agent.getReasoningEffort() != null) {
            return agent.getReasoningEffort();
        }
        return null;
    }

    private GendoxException missingOverrideException(String fieldName) {
        return new GendoxException("COMPLETION_RUNTIME_OVERRIDE_REQUIRED",
                "Missing required completion runtime value: " + fieldName,
                HttpStatus.BAD_REQUEST);
    }

    private String convertToAiModelTextQuestion(Message message, List<DocumentInstanceSectionDTO> nearestSections, ProjectAgent agent) throws GendoxException {

        // TODO investigate if we want to split the context and question
        //  to 2 different messages with role: "contextProvider" and role: "user"

        // take the types name
        Template agentSectionTemplate = templateRepository.findByIdIs(agent.getSectionTemplateId());
        Template agentChatTemplate = templateRepository.findByIdIs(agent.getChatTemplateId());

        // Prefer the document's own title; fall back to deriving a name from the remote URL when the title is missing
        List<String> documentTitles = nearestSections.stream()
                .map(section -> {
                    String title = section.getDocumentInstanceDTO().getTitle();
                    return Strings.isNotBlank(title)
                            ? title
                            : documentUtils.extractDocumentNameFromUrl(section.getDocumentInstanceDTO().getRemoteUrl());
                })
                .toList();

        // run sectionTemplate
        SectionTemplateAuthor sectionTemplateAuthor = new SectionTemplateAuthor();

        String sectionValues = sectionTemplateAuthor.sectionValues(nearestSections, agentSectionTemplate.getText(), documentTitles);

        // run chatTemplate
        ChatTemplateAuthor chatTemplateAuthor = new ChatTemplateAuthor();

        String question = chatTemplateAuthor.chatTemplate(message, sectionValues, agentChatTemplate.getText());


        return question;


    }
}

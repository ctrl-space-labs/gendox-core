package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import io.micrometer.observation.annotation.Observed;
import org.jetbrains.annotations.Nullable;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;

@Service
public class CompletionService {


    private final AiToolRegistry aiToolRegistry;
    Logger logger = LoggerFactory.getLogger(CompletionService.class);


    // "self" here will be the OAP proxy, to avoid self-invocation problem
    private CompletionService self;

    private ProjectService projectService;
    private MessageAiMessageConverter messageAiMessageConverter;
    private EmbeddingService embeddingService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private TypeService typeService;
    private TrainingService trainingService;
    private MessageService messageService;
    private OrganizationModelKeyService organizationModelKeyService;
    private AuditLogsService auditLogsService;
    private DocumentUtils documentUtils;


    private AiModelUtils aiModelUtils;

    private ObjectMapper objectMapper;
    private AiModelService aiModelService;

    @Autowired
    public CompletionService(@Lazy CompletionService self,
                             ProjectService projectService,
                             MessageAiMessageConverter messageAiMessageConverter,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TypeService typeService,
                             AiModelUtils aiModelUtils,
                             ProjectAgentService projectAgentService,
                             TrainingService trainingService,
                             OrganizationModelKeyService organizationModelKeyService,
                             MessageService messageService,
                             AuditLogsService auditLogsService,
                             DocumentUtils documentUtils,
                             ObjectMapper objectMapper,
                             AiModelService aiModelService,
                             AiToolRegistry aiToolRegistry) {
        this.self = self;
        this.projectService = projectService;
        this.messageAiMessageConverter = messageAiMessageConverter;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
        this.aiModelUtils = aiModelUtils;
        this.organizationModelKeyService = organizationModelKeyService;
        this.messageService = messageService;
        this.auditLogsService = auditLogsService;
        this.documentUtils = documentUtils;
        this.objectMapper = objectMapper;
        this.aiModelService = aiModelService;
        this.aiToolRegistry = aiToolRegistry;
    }

    private CompletionResponse getCompletionForMessages(List<AiModelMessage> aiModelMessages, String agentRole, AiModel aiModel,
                                                        AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                                        @Nullable ObjectNode responseJsonSchema) throws GendoxException {

        //choose the correct aiModel adapter
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl(aiModel.getAiModelProvider().getApiType().getName());
        CompletionResponse completionResponse = aiModelApiAdapterService.askCompletion(aiModelMessages, agentRole, aiModel, aiModelRequestParams, apiKey, tools, toolChoice, responseJsonSchema);
        return completionResponse;
    }


    /**
     * This method is used to get the completion for the given message and project.
     * It will search for the closest sections and return the completion response.
     * This is mainly used by the /chat API where the user asks a question and the agent searching in the knowledge base before answering.
     *
     * @param message
     * @param project
     * @return CompletionMessageDTO
     * @throws GendoxException
     * @throws IOException
     * @throws NoSuchAlgorithmException
     */
    @Observed(name = "CompletionService.getCompletionSearch",
            contextualName = "CompletionService#getCompletionSearch",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public CompletionMessageDTO getCompletionSearch(Message message, Project project) throws GendoxException, IOException, NoSuchAlgorithmException {

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();
        List<DocumentInstanceSectionDTO> searchHistorySections = new ArrayList<>();

        // search and rerank sections
        List<DocumentInstanceSectionDTO> sectionDTOs = embeddingService.findClosestSections(
                message,
                project,
                PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue())
        );



        int maxCompletionLimit = project.getProjectAgent().getMaxCompletionLimit().intValue();

        // Choose the sections that will be included in the completion response
        for (int i = 0; i < sectionDTOs.size(); i++) {
            DocumentInstanceSectionDTO section = sectionDTOs.get(i);
            if (i < maxCompletionLimit) {
                topSectionsForCompletion.add(section);
            } else {
                searchHistorySections.add(section);
            }
        }

        // Get the actual completion
        List<Message> completions = self.getCompletion(message, topSectionsForCompletion, project, null);

        // Associate the sections with the completion messages
        List<MessageSection> topCompletionMessageSections;
        List<MessageSection> searchHistoryMessageSections;
        for (Message m : completions) {
            if (m.getRole().equals("assistant")) {
                //each agent message connected with the sections
                topCompletionMessageSections = messageService.createMessageSections(topSectionsForCompletion, m, true);
                searchHistoryMessageSections = messageService.createMessageSections(searchHistorySections, m, false);
                messageService.updateMessageWithSections(m, topCompletionMessageSections);
            }
        }

        // Prepare the completion metadata
        List<ProvenAiMetadata> sectionInfos = sectionDTOs.stream()
                .map(section -> ProvenAiMetadata.builder()
                        .sectionId(section.getId()) // Section ID
                        .iscc(section.getDocumentSectionIsccCode())
                        .title(section.getDocumentSectionMetadata().getTitle())
                        .documentURL(section.getDocumentURL())
                        .tokens(section.getTokenCount())
                        .ownerName(section.getOwnerName())
                        .signedPermissionOfUseVc(section.getSignedPermissionOfUseVc())
                        .aiModelName(section.getAiModelName())
                        .build())
                .collect(Collectors.toList());

        return CompletionMessageDTO.builder()
                .messages(completions)
                .threadId(message.getThreadId())
                .provenAiMetadata(sectionInfos) // Populate with detailed section info
                .build();


    }


    /**
     * This method is used to get the completion for the given message and project.
     * The completion context need to be given either in the message or in the nearestSections.
     * Currently, if the agent wants to execute a tool, it will be marked as "done" and provided to the LLM for a final response.
     *
     * @param message the user message that contains the question
     * @param nearestSections the nearest sections that will be used to provide context for the completion.
     * @param project the project that contains the agent and its settings.
     * @return the list of responses. Might be more than one if there are tool calls in the completion response.
     * @throws GendoxException
     */
    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, Project project, @Nullable ObjectNode responseJsonSchema) throws GendoxException {
        return getCompletion(message, nearestSections, project, responseJsonSchema, null);
    }

    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections,
                                       @Nullable ObjectNode responseJsonSchema,
                                       @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        return getCompletion(message, nearestSections, null, responseJsonSchema, overrides);
    }

    @Observed(name = "CompletionService.getCompletion",
            contextualName = "CompletionService#getCompletion",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, @Nullable Project project,
                                       @Nullable ObjectNode responseJsonSchema,
                                       @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        CompletionRuntimeContext runtimeContext = resolveCompletionRuntimeContext(message, nearestSections, project, overrides);
        runModerationIfEnabled(runtimeContext);

        // TODO populate previous messages with local context, attached file, and attached images (in the ContentPart)
        // TODO rethink the logic, validate count of previous message tokens and drop messages if not enough space
        // TODO maybe add a similar logic to the embedding service to limit the number of messages
        List<AiModelMessage> previousMessages = messageService.getPreviousMessages(message, 25);

        //get contentParts without type "text"
        List<ContentPart> contentParts = message.getAdditionalResources().stream()
                .filter(part -> !"text".equals(part.getType()))
                .toList();

        // clone message to avoid changing the original message text in DB
        AiModelMessage promptMessage = AiModelMessage.builder()
                .content(runtimeContext.question())
                .contentParts(contentParts)
                .role(message.getRole() != null ? message.getRole() : "user")
                .build();
        previousMessages.add(promptMessage);

        // Pre-load audit log types so we reuse them in the loop
        Type completionRequestType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        Type completionResponseType = typeService.getAuditLogTypeByName("COMPLETION_RESPONSE");

        List<Message> allResponseMessages = new ArrayList<>();

        boolean hasToolCalls;
        int iteration = 0;
        // TODO: this indicate that is a deep thinking task, should be more explicit and not inferred by the presence cancelation token.
        int maxIterations = runtimeContext.cancellationToken() != null ? 50 : 5;

        do {
            if (runtimeContext.cancellationToken() != null && runtimeContext.cancellationToken().isCancelled()) {
                logger.info("Deep thinking cancelled, stopping completion loop at iteration {}", iteration);
                throw new GendoxException("DEEP_THINKING_CANCELLED", "Deep thinking was cancelled", HttpStatus.CONFLICT);
            }

            CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                    runtimeContext.agentRole(),
                    runtimeContext.completionModel(),
                    runtimeContext.aiModelRequestParams(),
                    runtimeContext.completionApiKey(),
                    runtimeContext.availableTools(),
                    "auto",
                    responseJsonSchema);

            saveCompletionAuditLogs(completionResponse, runtimeContext, completionRequestType, completionResponseType);

            Message completionResponseMessage = messageAiMessageConverter.toEntity(completionResponse.getChoices().get(0).getMessage());
            completionResponseMessage.setProjectId(runtimeContext.projectId());
            completionResponseMessage.setThreadId(message.getThreadId());
            completionResponseMessage.setCreatedBy(runtimeContext.createdByAgentUserId());
            completionResponseMessage.setUpdatedBy(runtimeContext.createdByAgentUserId());
            completionResponseMessage = messageService.createMessage(completionResponseMessage);

            allResponseMessages.add(completionResponseMessage);
            hasToolCalls = "tool_calls".equals(completionResponse.getChoices().getFirst().getFinishReason());

            if (hasToolCalls) {
                logger.info("Tool calls detected in completion response");

                // Execute all tools
                List<AiModelMessage> toolResponseMessages = handleToolExecution(
                        completionResponseMessage,
                        runtimeContext.project(),
                        runtimeContext.agent(),
                        runtimeContext.availableTools(),
                        runtimeContext.cancellationToken()
                );

                // Save tool response messages.
                toolResponseMessages.forEach(toolResponseMessage -> {
                    Message toolResponse = messageAiMessageConverter.toEntity(toolResponseMessage);
                    toolResponse.setProjectId(runtimeContext.projectId());
                    toolResponse.setThreadId(message.getThreadId());
                    toolResponse.setCreatedBy(runtimeContext.createdByAgentUserId());
                    toolResponse.setUpdatedBy(runtimeContext.createdByAgentUserId());
                    messageService.createMessage(toolResponse);
                    allResponseMessages.add(toolResponse);
                });

                // Sanity check: all tools responded
                if (completionResponseMessage.getToolCalls() == null ||
                        toolResponseMessages.size() != completionResponseMessage.getToolCalls().size()) {
                    logger.warn("Tool response count does not match tool calls; stopping tool loop.");
                    hasToolCalls = false; // avoid infinite loop with inconsistent state
                } else {
                    // Extend previousMessages for the *next* iteration ===
                    previousMessages.add(completionResponse.getChoices().get(0).getMessage());
                    previousMessages.addAll(toolResponseMessages);
                }
            }

            iteration++;

            if (iteration >= maxIterations && hasToolCalls) {
                logger.warn("Max tool-calling iterations ({}) reached, stopping loop.", maxIterations);
                hasToolCalls = false;
            }
        } while (hasToolCalls);

        return allResponseMessages;
    }

    private CompletionRuntimeContext resolveCompletionRuntimeContext(Message message,
                                                                    List<DocumentInstanceSectionDTO> nearestSections,
                                                                    @Nullable Project project,
                                                                    @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        ProjectAgent agent = Optional.ofNullable(project)
                .map(Project::getProjectAgent)
                .orElse(null);

        String question = resolveQuestion(message, nearestSections, agent);
        String agentRole = resolveSystemPrompt(agent, overrides);
        AiModel completionModel = resolveCompletionModel(agent, overrides);
        String completionApiKey = resolveCompletionApiKey(agent, overrides);
        Long maxTokens = resolveMaxTokens(agent, overrides);
        Double temperature = resolveTemperature(agent, overrides);
        Double topP = resolveTopP(agent, overrides);
        UUID projectId = resolveProjectId(project, overrides);
        UUID organizationId = resolveOrganizationId(project, overrides);
        UUID createdByAgentUserId = resolveCreatedByAgentUserId(agent, overrides);
        List<AiTools> availableTools = resolveAvailableTools(agent, overrides);

        AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(maxTokens)
                .temperature(temperature)
                .topP(topP)
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

    private void runModerationIfEnabled(CompletionRuntimeContext runtimeContext) throws GendoxException {
        if (!runtimeContext.hasProjectContext() || !Boolean.TRUE.equals(runtimeContext.agent().getModerationCheck())) {
            return;
        }
        String moderationApiKey = organizationModelKeyService.getDefaultKeyForAgent(runtimeContext.agent(), "MODERATION_MODEL");
        ModerationResponse moderationResponse = trainingService.getModeration(
                runtimeContext.question(),
                moderationApiKey,
                runtimeContext.agent().getModerationModel()
        );
        if (moderationResponse.getResults().get(0).isFlagged()) {
            throw new GendoxException("MODERATION_CHECK_FAILED", "The question did not pass moderation.", HttpStatus.NOT_ACCEPTABLE);
        }
    }

    private void saveCompletionAuditLogs(CompletionResponse completionResponse,
                                          CompletionRuntimeContext runtimeContext,
                                          Type completionRequestType,
                                          Type completionResponseType) {
        AuditLogs requestAuditLogs = auditLogsService.createDefaultAuditLogs(completionRequestType);
        requestAuditLogs.setTokenCount((long) completionResponse.getUsage().getPromptTokens());
        requestAuditLogs.setCachedTokenCount((long) Optional.ofNullable(completionResponse.getUsage())
                .map(u -> u.getPromptTokensDetail())
                .map(d -> d.getCachedTokens())
                .orElse(0));
        requestAuditLogs.setProjectId(runtimeContext.projectId());
        requestAuditLogs.setOrganizationId(runtimeContext.organizationId());
        auditLogsService.saveAuditLogs(requestAuditLogs);

        AuditLogs completionAuditLogs = auditLogsService.createDefaultAuditLogs(completionResponseType);
        completionAuditLogs.setTokenCount((long) completionResponse.getUsage().getCompletionTokens());
        completionAuditLogs.setReasoningTokenCount((long) Optional.ofNullable(completionResponse.getUsage())
                .map(u -> u.getCompletionTokensDetail())
                .map(d -> d.getReasoningTokens())
                .orElse(0));
        completionAuditLogs.setProjectId(runtimeContext.projectId());
        completionAuditLogs.setOrganizationId(runtimeContext.organizationId());
        auditLogsService.saveAuditLogs(completionAuditLogs);
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

    private List<AiTools> resolveAvailableTools(@Nullable ProjectAgent agent,
                                                 @Nullable CompletionRuntimeOverridesDTO overrides) {
        if (overrides != null && overrides.getAiTools() != null && !overrides.getAiTools().isEmpty()) {
            return overrides.getAiTools();
        }
        if (agent != null) return agent.getAiTools();
        return Collections.emptyList();
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

    private GendoxException missingOverrideException(String fieldName) {
        return new GendoxException("COMPLETION_RUNTIME_OVERRIDE_REQUIRED",
                "Missing required completion runtime value: " + fieldName,
                HttpStatus.BAD_REQUEST);
    }

    private record CompletionRuntimeContext(
            @Nullable Project project,
            @Nullable ProjectAgent agent,
            String question,
            String agentRole,
            AiModel completionModel,
            String completionApiKey,
            AiModelRequestParams aiModelRequestParams,
            List<AiTools> availableTools,
            UUID projectId,
            UUID organizationId,
            UUID createdByAgentUserId,
            @Nullable CancellationToken cancellationToken
    ) {
        private boolean hasProjectContext() {
            return project != null && agent != null;
        }
    }

    /**
     * TODO enable this from Agent settings
     *
     * This method is used to get the advanced search message to get embedding and apply semantic search.
     * The response of this function will be used to search the vector store, instead of the actual user message.
     *
     * @param message
     * @param project
     * @return
     * @throws GendoxException
     */
    public AiModelMessage getAdvancedSearchCompletion(Message message, Project project) throws GendoxException {
        String question = message.getValue();
        ProjectAgent agent = project.getProjectAgent();
        List<AiTools> advancedSearchTools = List.of(
                AiTools.builder()
                        .type("function")
                        .jsonSchema("""
                                {
                                  "name": "advanced_search",
                                  "description": "Compose a single semantic-search query for the vector store.\\n\\n▸ INPUTS\\n  • Full chat history (chronological) plus the user’s latest turn.\\n\\n▸ WHEN THE USER ASKS A FOLLOW-UP (e.g. “Tell me more”, “Why?”)\\n  • Infer the missing subject from the last few assistant/user messages.\\n  • Focus on the newest context; ignore unrelated earlier turns.\\n\\n▸ QUERY LENGTH RULES\\n  • Let query length scale with the user’s current message:\\n      − If user says something that doesn't require follow-up search, like 'thanks', return empty string in the search_query.\\n      − If the user’s turn is brief (≲ 20 words) → expand with synonyms / related phrases.\\n      − If the turn is long (≫ 100 words) → condense to the core concepts; ~10–50 % of the user’s tokens is fine, it MUST NEVER be more that 4000 characters.\\n\\n▸ QUERY CONTENT RULES\\n  • Preserve the user’s main nouns/verbs.\\n  • Add 2–4 plausible synonyms or closely related terms for each key concept to improve recall.\\n  • Remove filler words, conjunctions, and polite phrases.\\n  • Do NOT answer the question or cite documents—only return the query text.",
                                  "strict": true,
                                  "parameters": {
                                    "type": "object",
                                    "required": ["search_query"],
                                    "properties": {
                                      "search_query": {
                                        "type": "string",
                                        "description": "The query to be used in the vector search in a document DB."
                                      }
                                    },
                                    "additionalProperties": false
                                  }
                                }
                                """)
                        .build());

        List<AiModelMessage> previousMessages = messageService.getPreviousMessages(message, 25);

        // clone message to avoid changing the original message text in DB
        AiModelMessage promptMessage = AiModelMessage.builder()
                .content(question)
                .role(message.getRole() != null ? message.getRole() : "user")
                .build();

        previousMessages.add(promptMessage);

        String apiKey = embeddingService.getApiKey(agent, "COMPLETION_MODEL");

        AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(agent.getMaxToken())
                .temperature(agent.getTemperature())
                .topP(agent.getTopP())
                .build();

        CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                agent.getAgentBehavior(),
                agent.getCompletionModel(),
                aiModelRequestParams,
                apiKey,
                advancedSearchTools,
                "required",
                null);

        return completionResponse.getChoices().get(0).getMessage();
    }

    /**
     * executes the tools that requested by the agent in the completion response.
     * returns a list of messages that contains the result of the tool execution.
     *
     * If the tool execution type is "backend" then it executed the function calling
     * if the execution is for the "frontend" then it just returns the message for the frontend to handle it.
     *
     * @param completionResponseMessage
     * @param project
     * @param agent
     * @param availableTools
     * @return
     */
    private List<AiModelMessage> handleToolExecution(Message completionResponseMessage, @Nullable Project project, @Nullable ProjectAgent agent, List<AiTools> availableTools, @Nullable CancellationToken cancellationToken) {
        Map<String, AiTools> toolMap = new HashMap<>();
        //map available tools for quick lookup, parse the jsonSchema to JsonNode and find the .function.name property
        availableTools.forEach(tool -> {

            JsonNode functionObj = null; // json_schema is the whole function block
            try {
                functionObj = objectMapper.readTree(tool.getJsonSchema());
            } catch (JsonProcessingException e) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA", "Tool json schema is not a valid JSON", e);
            }
            String toolName = functionObj.get("name").asText();
            toolMap.put(toolName, tool);
        });


        List<AiModelMessage> toolExecutionMessages = new ArrayList<>();

        completionResponseMessage.getToolCalls().forEach(toolCall -> {
            String toolName = toolCall.get("function").get("name").asText();
            AiTools toolDefinition = toolMap.get(toolName);
            if (toolDefinition == null) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_FOUND", "Tool with name " + toolName + " not found in available tools");
            }

            JsonNode args = toolCall.get("function").get("arguments");
            ToolExecutionContext ctx = new ToolExecutionContext(project, agent, completionResponseMessage, toolDefinition, cancellationToken);
            JsonNode result = aiToolRegistry.execute(toolName, args, ctx);

            AiModelMessage message = new AiModelMessage();
            message.setRole("tool");
            message.setToolCallId(toolCall.get("id").asText());
            message.setName(toolName);
            message.setContent(result.toString());
            toolExecutionMessages.add(message);
        });

        return toolExecutionMessages;
    }


    public String convertToAiModelTextQuestion(Message message, List<DocumentInstanceSectionDTO> nearestSections, ProjectAgent agent) throws GendoxException {

        // TODO investigate if we want to split the context and question
        //  to 2 different messages with role: "contextProvider" and role: "user"

        // take the types name
        Template agentSectionTemplate = templateRepository.findByIdIs(agent.getSectionTemplateId());
        Template agentChatTemplate = templateRepository.findByIdIs(agent.getChatTemplateId());

        List<String> documentTitles = nearestSections.stream()
                .map(section -> documentUtils.extractDocumentNameFromUrl(section.getDocumentInstanceDTO().getRemoteUrl()))
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

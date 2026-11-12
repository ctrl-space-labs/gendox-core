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
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.AdvancedSearchTool;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import io.micrometer.observation.annotation.Observed;
import org.jetbrains.annotations.Nullable;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.function.Consumer;

import org.slf4j.Logger;

@Service
public class CompletionService {


    private final AiToolRegistry aiToolRegistry;
    Logger logger = LoggerFactory.getLogger(CompletionService.class);


    // "self" here will be the OAP proxy, to avoid self-invocation problem
    private CompletionService self;

    private ProjectService projectService;
    private MessageAiMessageConverter messageAiMessageConverter;
    private ProjectAgentRepository projectAgentRepository;
    private TypeService typeService;
    private TrainingService trainingService;
    private MessageService messageService;
    private OrganizationModelKeyService organizationModelKeyService;
    private AuditLogsService auditLogsService;

    // Field-injected: the turn service calls back into this service to resume a turn
    @Autowired
    @Lazy
    private CompletionTurnService completionTurnService;
    @Autowired
    private MessageLocalContextService messageLocalContextService;


    private AiModelUtils aiModelUtils;

    private ObjectMapper objectMapper;
    private CompletionRuntimeContextResolver contextResolver;
    private ToolExecutionService toolExecutionService;

    /** Tool rounds a completion may take before it must answer; deep thinking gets 20. Skill work (read a skill, look, then change) needs more than a few. */
    @Value("${gendox.agents.max-tool-iterations:12}")
    private int maxToolIterations = 12;

    // How a chat agent uses the project's documents, by knowledge search mode (#542)
    private static final String AUTO_SEARCH_INSTRUCTIONS = """
            # Project documents
            The documents of this project are searched with the advanced_search tool. Before you answer a \
            question, call advanced_search unless the question is something basic like a greeting. \
            Base your answer on what the search returns. \
            If it finds nothing relevant, search again with other words, and if there is \
            still nothing, say so instead of guessing.""";
    private static final String ALWAYS_SEARCH_INSTRUCTIONS = """
            # Project documents
            The documents of this project are searched with the advanced_search tool. Always call \
            advanced_search before you answer, and base your answer only on what the search returns. If it \
            finds nothing relevant, search again with other words, and if there is still nothing, say so \
            instead of guessing.""";

    @Autowired
    public CompletionService(@Lazy CompletionService self,
                             ProjectService projectService,
                             MessageAiMessageConverter messageAiMessageConverter,
                             ProjectAgentRepository projectAgentRepository,
                             TypeService typeService,
                             AiModelUtils aiModelUtils,
                             ProjectAgentService projectAgentService,
                             TrainingService trainingService,
                             OrganizationModelKeyService organizationModelKeyService,
                             MessageService messageService,
                             AuditLogsService auditLogsService,
                             ObjectMapper objectMapper,
                             AiToolRegistry aiToolRegistry,
                             CompletionRuntimeContextResolver contextResolver,
                             ToolExecutionService toolExecutionService) {
        this.self = self;
        this.projectService = projectService;
        this.messageAiMessageConverter = messageAiMessageConverter;
        this.projectAgentRepository = projectAgentRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
        this.aiModelUtils = aiModelUtils;
        this.organizationModelKeyService = organizationModelKeyService;
        this.messageService = messageService;
        this.auditLogsService = auditLogsService;
        this.objectMapper = objectMapper;
        this.aiToolRegistry = aiToolRegistry;
        this.contextResolver = contextResolver;
        this.toolExecutionService = toolExecutionService;
    }

    private CompletionResponse getCompletionForMessages(List<AiModelMessage> aiModelMessages, String agentRole, AiModel aiModel,
                                                        AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                                        @Nullable ObjectNode responseJsonSchema) throws GendoxException {

        return getCompletionForMessages(aiModelMessages, agentRole, aiModel, aiModelRequestParams, apiKey, tools, toolChoice, responseJsonSchema, null);
    }

    /** @param deltas receives the model's tokens as they arrive; null asks the provider for the whole response */
    private CompletionResponse getCompletionForMessages(List<AiModelMessage> aiModelMessages, String agentRole, AiModel aiModel,
                                                        AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice,
                                                        @Nullable ObjectNode responseJsonSchema,
                                                        @Nullable Consumer<CompletionDelta> deltas) throws GendoxException {

        //choose the correct aiModel adapter
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl(aiModel.getApiType().getName());
        CompletionResponse completionResponse = aiModelApiAdapterService.askCompletion(aiModelMessages, agentRole, aiModel, aiModelRequestParams, apiKey, tools, toolChoice, responseJsonSchema, deltas);
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
            contextualName = "CompletionService#getCompletionSearch")
    public CompletionMessageDTO getCompletionSearch(Message message, Project project, CompletionListener listener) throws GendoxException, IOException, NoSuchAlgorithmException {

        // The agent searches the documents itself, with advanced_search
        List<Message> completions = self.getCompletion(message, List.of(), project, null,
                chatOverrides(message, project), listener);

        linkSources(message);
        return chatResponse(message, completions, listener);
    }

    public CompletionMessageDTO getCompletionSearch(Message message, Project project) throws GendoxException, IOException, NoSuchAlgorithmException {
        return getCompletionSearch(message, project, CompletionListener.none());
    }

    /** Continues a chat turn that waited for CLIENT tool results, once they are all saved. */
    public CompletionMessageDTO resumeCompletionSearch(CompletionTurn turn, CompletionListener listener) throws GendoxException {
        Project project = projectService.getProjectById(turn.getProjectId());
        Message message = messageService.getMessageWithLocalContexts(turn.getUserMessageId());
        message.setAdditionalResources(messageLocalContextService.getImageContentPartsFromLocalContext(message));

        CompletionRuntimeOverridesDTO overrides = chatOverrides(message, project).toBuilder()
                .turnMessages(turnMessages(message))
                .turnIterations(turn.getIteration())
                .build();
        List<Message> completions = self.getCompletion(message, List.of(), project, null, overrides, listener);

        linkSources(message);
        return chatResponse(message, completions, listener);
    }

    private static String searchMode(ProjectAgent agent) {
        if (agent.getAdvancedSearchMode() == null) {
            return "ALWAYS";
        }
        return agent.getAdvancedSearchMode();
    }

    /**
     * What chat sends differently from other callers: advanced_search among the tools and the
     * instructions to use it. In ALWAYS mode the first model call of a turn must call a tool.
     */
    private CompletionRuntimeOverridesDTO chatOverrides(Message message, Project project) {
        // A fixed order, so a resumed turn renders the question exactly as it was first sent
        message.getLocalContexts().sort(Comparator.comparing(MessageLocalContext::getId));

        String mode = searchMode(project.getProjectAgent());
        CompletionRuntimeOverridesDTO.CompletionRuntimeOverridesDTOBuilder overrides = CompletionRuntimeOverridesDTO.builder()
                .aiTools(chatTools(project.getProjectAgent(), mode));
        switch (mode) {
            case "ALWAYS" -> overrides.instructions(ALWAYS_SEARCH_INSTRUCTIONS).firstToolChoice("required");
            case "AUTO" -> overrides.instructions(AUTO_SEARCH_INSTRUCTIONS);
            default -> {
            }
        }
        return overrides.build();
    }

    /** The agent's tools in a stable (name) order, so the prompt cache matches, plus advanced_search unless search is OFF. */
    private List<AiTools> chatTools(ProjectAgent agent, String mode) {
        Map<String, AiTools> tools = new TreeMap<>();
        for (AiTools tool : agent.getAiTools()) {
            String name = contextResolver.toolName(tool);
            if (name != null) {
                tools.put(name, tool);
            }
        }
        if (!"OFF".equals(mode)) {
            String search = aiToolRegistry.getOpenAiToolDefinitions(AdvancedSearchTool.TOOL_NAME).get(0).get("function").toString();
            tools.put(AdvancedSearchTool.TOOL_NAME, AiTools.builder().type("function").jsonSchema(search).build());
        }
        return new ArrayList<>(tools.values());
    }

    /** The assistant and tool messages a waiting turn already saved after its question. */
    private List<AiModelMessage> turnMessages(Message question) throws GendoxException {
        List<AiModelMessage> turnMessages = new ArrayList<>();
        for (Message saved : messageService.getMessagesAfter(question)) {
            turnMessages.add(messageAiMessageConverter.toDTO(saved));
        }
        return turnMessages;
    }

    /** The answer's sources: the sections the agent found with advanced_search during the turn. */
    private void linkSources(Message question) throws GendoxException {
        List<Message> turn = messageService.getMessagesAfter(question);
        if (turn.isEmpty() || !isFinalAnswer(turn.getLast())) {
            return;
        }
        Map<UUID, MessageSection> sources = new LinkedHashMap<>();
        for (Message saved : turn) {
            if (!"tool".equals(saved.getRole()) || !AdvancedSearchTool.TOOL_NAME.equals(saved.getName())) {
                continue;
            }
            for (JsonNode section : readJson(saved.getValue()).path("sections")) {
                MessageSection source = new MessageSection();
                source.setSectionId(UUID.fromString(section.path("section_id").asText()));
                source.setDocumentId(UUID.fromString(section.path("document_id").asText()));
                source.setCompletionParticipant(true);
                sources.putIfAbsent(source.getSectionId(), source);
            }
        }
        if (!sources.isEmpty()) {
            messageService.linkSections(turn.getLast(), new ArrayList<>(sources.values()));
        }
    }

    // A turn that waits for the page's tool results has no answer yet
    private static boolean isFinalAnswer(Message message) {
        boolean hasToolCalls = message.getToolCalls() != null && !message.getToolCalls().isEmpty();
        return "assistant".equals(message.getRole()) && !hasToolCalls;
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException e) {
            return objectMapper.createObjectNode();
        }
    }

    private CompletionMessageDTO chatResponse(Message question, List<Message> completions, CompletionListener listener) {
        CompletionMessageDTO.CompletionMessageDTOBuilder response = CompletionMessageDTO.builder()
                .messages(completions)
                .threadId(question.getThreadId())
                .provenAiMetadata(List.of());

        CompletionTurn waitingTurn = listener.getWaitingTurn();
        if (waitingTurn != null) {
            response.status(waitingTurn.getStatus())
                    .turnId(waitingTurn.getUserMessageId())
                    .resumeToken(waitingTurn.getResumeToken());
        }
        return response.build();
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

    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, @Nullable Project project,
                                       @Nullable ObjectNode responseJsonSchema,
                                       @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        return getCompletion(message, nearestSections, project, responseJsonSchema, overrides, CompletionListener.none());
    }

    @Observed(name = "CompletionService.getCompletion",
            contextualName = "CompletionService#getCompletion")
    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, @Nullable Project project,
                                       @Nullable ObjectNode responseJsonSchema,
                                       @Nullable CompletionRuntimeOverridesDTO overrides,
                                       CompletionListener listener) throws GendoxException {
        CompletionRuntimeContext runtimeContext = contextResolver.resolve(message, nearestSections, project, overrides);
        runModerationIfEnabled(runtimeContext);

        List<AiModelMessage> previousMessages;
        if (overrides != null && overrides.getPreviousMessages() != null && !overrides.getPreviousMessages().isEmpty()) {
            // TODO handle this in the CompletionRuntimeContextResolver
            previousMessages = overrides.getPreviousMessages();
        } else {
            // TODO populate previous messages with local context, attached file, and attached images (in the ContentPart)
            // TODO rethink the logic, validate count of previous message tokens and drop messages if not enough space
            // TODO maybe add a similar logic to the embedding service to limit the number of messages
            previousMessages = messageService.getPreviousMessages(message, 25);
        }

        //get contentParts without type "text"
        List<ContentPart> contentParts = message.getAdditionalResources().stream()
                .filter(part -> !"text".equals(part.getType()))
                .toList();
        AiModelMessage promptMessage = AiModelMessage.builder()
                .id(message.getId()) // a tool in a background job finds who started it from this message
                .content(runtimeContext.question())
                .contentParts(contentParts)
                .role(message.getRole() != null ? message.getRole() : "user")
                .build();
        previousMessages.add(promptMessage);
        // A resumed turn continues after the messages it already made
        previousMessages.addAll(resolveTurnMessages(overrides));

        // Pre-load audit log types so we reuse them in the loop
        Type completionRequestType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        Type completionResponseType = typeService.getAuditLogTypeByName("COMPLETION_RESPONSE");

        List<Message> allResponseMessages = new ArrayList<>();

        boolean hasToolCalls;
        int iteration = resolveTurnIterations(overrides);
        // TODO: this indicate that is a deep thinking task, should be more explicit and not inferred by the presence cancelation token.
        boolean isDeepThinking = runtimeContext.cancellationToken() != null;
        int maxIterations = isDeepThinking ? 20 : maxToolIterations;

        do {
            if (runtimeContext.cancellationToken() != null && runtimeContext.cancellationToken().isCancelled()) {
                logger.info("Deep thinking cancelled, stopping completion loop at iteration {}", iteration);
                throw new GendoxException("DEEP_THINKING_CANCELLED", "Deep thinking was cancelled", HttpStatus.CONFLICT);
            }

            // TODO add from the orginal thread, the system prompt and the first user message to give to the subagent the original context
            //  and also to hit cache for the long original messages.
            CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                    runtimeContext.agentRole(),
                    runtimeContext.completionModel(),
                    runtimeContext.aiModelRequestParams(),
                    runtimeContext.completionApiKey(),
                    runtimeContext.availableTools(),
                    toolChoice(iteration, overrides),
                    responseJsonSchema,
                    listener.deltas());

            saveCompletionAuditLogs(completionResponse, runtimeContext, completionRequestType, completionResponseType);

            Message completionResponseMessage = messageAiMessageConverter.toEntity(completionResponse.getChoices().get(0).getMessage());
            completionResponseMessage.setAiModelId(runtimeContext.completionModel().getId());
            completionResponseMessage.setProjectId(runtimeContext.projectId());
            completionResponseMessage.setThreadId(message.getThreadId());
            completionResponseMessage.setCreatedBy(runtimeContext.createdByAgentUserId());
            completionResponseMessage.setUpdatedBy(runtimeContext.createdByAgentUserId());
            completionResponseMessage = messageService.createMessage(completionResponseMessage);
            listener.onMessage(completionResponseMessage);

            allResponseMessages.add(completionResponseMessage);
            hasToolCalls = "tool_calls".equals(completionResponse.getChoices().getFirst().getFinishReason());

            if (hasToolCalls) {
                logger.info("Tool calls detected in completion response");

                // Execute all tools. CLIENT tools the client will answer are left pending, unless this is the last allowed call.
                boolean canWaitForClient = listener.waitsForClientTools() && iteration + 1 < maxIterations;
                ToolExecutionService.ToolRound round = toolExecutionService.run(completionResponseMessage, previousMessages,
                        runtimeContext, listener, canWaitForClient);
                List<AiModelMessage> toolResponseMessages = round.results();

                // Save tool response messages.
                toolResponseMessages.forEach(toolResponseMessage -> {
                    Message toolResponse = messageAiMessageConverter.toEntity(toolResponseMessage);
                    toolResponse.setProjectId(runtimeContext.projectId());
                    toolResponse.setThreadId(message.getThreadId());
                    toolResponse.setCreatedBy(runtimeContext.createdByAgentUserId());
                    toolResponse.setUpdatedBy(runtimeContext.createdByAgentUserId());
                    messageService.createMessage(toolResponse);
                    listener.onMessage(toolResponse);
                    allResponseMessages.add(toolResponse);
                });

                // The turn stops here until the client posts the results (or they time out)
                if (!round.pending().isEmpty()) {
                    CompletionTurn turn = completionTurnService.suspend(message, completionResponseMessage, round.pending(), iteration + 1);
                    listener.onWaitingForTools(turn);
                    return allResponseMessages;
                }

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

            if (iteration == maxIterations - 1 && hasToolCalls) {
                logger.warn("Sending warning message to LLM about approaching max tool-calling iterations (iteration {})", iteration);
                previousMessages.add(AiModelMessage.builder()
                        .role("user")
                        .content("SYSTEM WARNING: You are approaching the maximum number of tool-calling iterations. "
                                + "In your NEXT message you MUST provide the final answer to the user (no more tool calls). "
                                + "If you do not provide a final answer, the request will timeout.")
                        .build());
            }

            if (iteration >= maxIterations && hasToolCalls) {
                logger.warn("Max tool-calling iterations ({}) reached, stopping loop.", maxIterations);
                hasToolCalls = false;
            }
        } while (hasToolCalls);

        return allResponseMessages;
    }

    private List<AiModelMessage> resolveTurnMessages(@Nullable CompletionRuntimeOverridesDTO overrides) {
        if (overrides == null || overrides.getTurnMessages() == null) {
            return List.of();
        }
        return overrides.getTurnMessages();
    }

    private int resolveTurnIterations(@Nullable CompletionRuntimeOverridesDTO overrides) {
        if (overrides == null) {
            return 0;
        }
        return overrides.getTurnIterations();
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

    private static String toolChoice(int iteration, @Nullable CompletionRuntimeOverridesDTO overrides) {
        if (iteration == 0 && overrides != null && overrides.getFirstToolChoice() != null) {
            return overrides.getFirstToolChoice();
        }
        return "auto";
    }

}

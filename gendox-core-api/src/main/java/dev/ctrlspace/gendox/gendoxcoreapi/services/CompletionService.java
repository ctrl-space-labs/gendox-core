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
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.AdvancedSearchTool;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn.PendingCall;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import io.micrometer.observation.annotation.Observed;
import org.apache.logging.log4j.util.Strings;
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

    // Field-injected: the turn service calls back into this service to resume a turn
    @Autowired
    @Lazy
    private CompletionTurnService completionTurnService;
    @Autowired
    private MessageLocalContextService messageLocalContextService;


    private AiModelUtils aiModelUtils;

    private ObjectMapper objectMapper;
    private AiModelService aiModelService;
    private SkillService skillService;

    /** Tool rounds a completion may take before it must answer; deep thinking gets 20. Skill work (read a skill, look, then change) needs more than a few. */
    @Value("${gendox.agents.max-tool-iterations:12}")
    private int maxToolIterations = 12;

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
                             AiToolRegistry aiToolRegistry,
                             SkillService skillService) {
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
        this.skillService = skillService;
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
            contextualName = "CompletionService#getCompletionSearch",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public CompletionMessageDTO getCompletionSearch(Message message, Project project, CompletionListener listener) throws GendoxException, IOException, NoSuchAlgorithmException {

        // A new message ends a turn that still waits for the page's tool results
        completionTurnService.cancelWaitingTurn(message.getThreadId());

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();
        List<DocumentInstanceSectionDTO> searchHistorySections = new ArrayList<>();

        // search and rerank sections, unless the agent searches by itself (AUTO) or not at all (OFF)
        List<DocumentInstanceSectionDTO> sectionDTOs = searchBeforeAnswering(message, project);

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

        // Kept with the question too, so a later turn can render the question exactly as it was sent
        messageService.createMessageSections(topSectionsForCompletion, message, true);
        messageService.createMessageSections(searchHistorySections, message, false);

        // Get the actual completion
        List<Message> completions = self.getCompletion(message, topSectionsForCompletion, project, null,
                chatOverrides(message, project), listener);

        // Associate the sections with the completion messages
        linkSources(message, completions);

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

        return chatResponse(message, completions, sectionInfos, listener);
    }

    public CompletionMessageDTO getCompletionSearch(Message message, Project project) throws GendoxException, IOException, NoSuchAlgorithmException {
        return getCompletionSearch(message, project, CompletionListener.none());
    }

    /**
     * Continues a chat turn that waited for CLIENT tool results, once they are all saved. The
     * question is rendered again with the sections it was asked with, so the request starts as before.
     */
    public CompletionMessageDTO resumeCompletionSearch(CompletionTurn turn, CompletionListener listener) throws GendoxException {
        Project project = projectService.getProjectById(turn.getProjectId());
        Message message = messageService.getMessagesWithLocalContexts(List.of(turn.getUserMessageId())).get(turn.getUserMessageId());
        message.setAdditionalResources(messageLocalContextService.getImageContentPartsFromLocalContext(message));
        List<DocumentInstanceSectionDTO> sections = messageService.getCompletionSections(List.of(message.getId()))
                .getOrDefault(message.getId(), List.of());

        CompletionRuntimeOverridesDTO overrides = chatOverrides(message, project).toBuilder()
                .turnMessages(turnMessages(message))
                .turnIterations(turn.getIteration())
                .build();
        List<Message> completions = self.getCompletion(message, sections, project, null, overrides, listener);

        linkSources(message, completions);
        return chatResponse(message, completions, List.of(), listener);
    }

    /** ALWAYS: search the documents, as chat always has. AUTO and OFF: the agent searches with advanced_search, or not at all. */
    private List<DocumentInstanceSectionDTO> searchBeforeAnswering(Message message, Project project) throws GendoxException, IOException, NoSuchAlgorithmException {
        if (!"ALWAYS".equals(searchMode(project.getProjectAgent()))) {
            return List.of();
        }
        return embeddingService.findClosestSections(
                message,
                project,
                PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue())
        );
    }

    private static String searchMode(ProjectAgent agent) {
        if (agent.getAdvancedSearchMode() == null) {
            return "ALWAYS";
        }
        return agent.getAdvancedSearchMode();
    }

    /**
     * What chat sends differently from other callers: the history with every question rendered as it
     * was sent (so the provider's prompt cache matches), and advanced_search among the tools.
     */
    private CompletionRuntimeOverridesDTO chatOverrides(Message message, Project project) throws GendoxException {
        // A fixed order, so the question renders the same way every time
        message.getLocalContexts().sort(Comparator.comparing(MessageLocalContext::getId));
        return CompletionRuntimeOverridesDTO.builder()
                .previousMessages(chatHistory(message, project.getProjectAgent()))
                .aiTools(chatTools(project.getProjectAgent()))
                .build();
    }

    private List<AiModelMessage> chatHistory(Message message, ProjectAgent agent) throws GendoxException {
        List<AiModelMessage> history = new ArrayList<>(messageService.getPreviousMessages(message, 25));
        List<UUID> questionIds = history.stream()
                .filter(previous -> "user".equals(previous.getRole()))
                .map(AiModelMessage::getId)
                .toList();
        Map<UUID, Message> questions = messageService.getMessagesWithLocalContexts(questionIds);
        Map<UUID, List<DocumentInstanceSectionDTO>> sections = messageService.getCompletionSections(questionIds);

        for (AiModelMessage previous : history) {
            if (!"user".equals(previous.getRole()) || !questions.containsKey(previous.getId())) {
                continue;
            }
            Message question = questions.get(previous.getId());
            question.getLocalContexts().sort(Comparator.comparing(MessageLocalContext::getId));
            previous.setContent(convertToAiModelTextQuestion(question, sections.getOrDefault(question.getId(), List.of()), agent));
        }
        return history;
    }

    /** The agent's tools in a stable (name) order, so the prompt cache matches, plus advanced_search unless search is OFF. */
    private List<AiTools> chatTools(ProjectAgent agent) {
        Map<String, AiTools> tools = new TreeMap<>();
        for (AiTools tool : agent.getAiTools()) {
            String name = toolName(tool);
            if (name != null) {
                tools.put(name, tool);
            }
        }
        if (!"OFF".equals(searchMode(agent))) {
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

    /**
     * Each answer's sources: the sections searched before answering (kept with the question) and
     * those the agent found with advanced_search during the turn.
     */
    private void linkSources(Message question, List<Message> completions) throws GendoxException {
        List<MessageSection> sources = new ArrayList<>(messageService.getMessageSections(question.getId()));
        sources.addAll(toolSearchSources(completions));

        for (Message completion : completions) {
            if (!"assistant".equals(completion.getRole())) {
                continue;
            }
            List<MessageSection> links = messageService.copyMessageSections(sources, completion);
            messageService.updateMessageWithSections(completion, links);
        }
    }

    private List<MessageSection> toolSearchSources(List<Message> completions) {
        List<MessageSection> sources = new ArrayList<>();
        for (Message completion : completions) {
            if (!"tool".equals(completion.getRole()) || !AdvancedSearchTool.TOOL_NAME.equals(completion.getName())) {
                continue;
            }
            for (JsonNode section : readJson(completion.getValue()).path("sections")) {
                MessageSection source = new MessageSection();
                source.setSectionId(UUID.fromString(section.path("section_id").asText()));
                source.setDocumentId(UUID.fromString(section.path("document_id").asText()));
                source.setCompletionParticipant(true);
                sources.add(source);
            }
        }
        return sources;
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (JsonProcessingException e) {
            return objectMapper.createObjectNode();
        }
    }

    private CompletionMessageDTO chatResponse(Message question, List<Message> completions, List<ProvenAiMetadata> sectionInfos,
                                              CompletionListener listener) {
        CompletionMessageDTO.CompletionMessageDTOBuilder response = CompletionMessageDTO.builder()
                .messages(completions)
                .threadId(question.getThreadId())
                .provenAiMetadata(sectionInfos); // Populate with detailed section info

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
            contextualName = "CompletionService#getCompletion",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, @Nullable Project project,
                                       @Nullable ObjectNode responseJsonSchema,
                                       @Nullable CompletionRuntimeOverridesDTO overrides,
                                       CompletionListener listener) throws GendoxException {
        CompletionRuntimeContext runtimeContext = resolveCompletionRuntimeContext(message, nearestSections, project, overrides);
        runModerationIfEnabled(runtimeContext);

        List<AiModelMessage> previousMessages;
        if (overrides != null && overrides.getPreviousMessages() != null && !overrides.getPreviousMessages().isEmpty()) {
            // TODO handle this in the resolveCompletionRuntimeContext
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
                    "auto",
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
                List<PendingCall> pendingCalls = new ArrayList<>();
                List<AiModelMessage> toolResponseMessages = handleToolExecution(
                        completionResponseMessage,
                        previousMessages,
                        runtimeContext.project(),
                        runtimeContext.agent(),
                        runtimeContext.availableTools(),
                        runtimeContext.cancellationToken(),
                        listener,
                        canWaitForClient,
                        pendingCalls
                );

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
                if (!pendingCalls.isEmpty()) {
                    CompletionTurn turn = completionTurnService.suspend(message, completionResponseMessage, pendingCalls, iteration + 1);
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

    private CompletionRuntimeContext resolveCompletionRuntimeContext(Message message,
                                                                    List<DocumentInstanceSectionDTO> nearestSections,
                                                                    @Nullable Project project,
                                                                    @Nullable CompletionRuntimeOverridesDTO overrides) throws GendoxException {
        ProjectAgent agent = Optional.ofNullable(project)
                .map(Project::getProjectAgent)
                .orElse(null);

        List<AgentSkill> agentSkills = skillsFor(agent, message, overrides);

        String question = resolveQuestion(message, nearestSections, agent);
        String agentRole = appendSkillsHeader(resolveSystemPrompt(agent, overrides), agentSkills);
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
    private String toolName(AiTools tool) {
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
                .reasoningEffort(agent.getReasoningEffort())
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
    private List<AiModelMessage> handleToolExecution(Message completionResponseMessage, List<AiModelMessage> parentPreviousMessages, @Nullable Project project, @Nullable ProjectAgent agent, List<AiTools> availableTools, @Nullable CancellationToken cancellationToken) {
        return handleToolExecution(completionResponseMessage, parentPreviousMessages, project, agent, availableTools, cancellationToken,
                CompletionListener.none(), false, new ArrayList<>());
    }

    /**
     * @param canWaitForClient whether CLIENT tools are left for the client to answer
     * @param pendingCalls     receives the CLIENT calls left for the client; they get no tool message here
     */
    private List<AiModelMessage> handleToolExecution(Message completionResponseMessage, List<AiModelMessage> parentPreviousMessages, @Nullable Project project, @Nullable ProjectAgent agent, List<AiTools> availableTools, @Nullable CancellationToken cancellationToken,
                                                     CompletionListener listener, boolean canWaitForClient, List<PendingCall> pendingCalls) {
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
        List<JsonNode> clientToolCalls = new ArrayList<>();

        completionResponseMessage.getToolCalls().forEach(toolCall -> {
            String toolName = toolCall.get("function").get("name").asText();
            AiTools toolDefinition = toolMap.get(toolName);
            if (toolDefinition == null) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_FOUND", "Tool with name " + toolName + " not found in available tools");
            }

            // Tools without a backend handler run on the page or app that sent the message
            boolean runsOnClient = !aiToolRegistry.supports(toolName);
            if (runsOnClient && canWaitForClient && "CLIENT".equals(toolDefinition.getExecution())) {
                pendingCalls.add(new PendingCall(toolCall.get("id").asText(), completionResponseMessage.getId(), toolName,
                        toolCall.get("function").get("arguments").asText()));
                return;
            }
            if (runsOnClient) {
                clientToolCalls.add(toolCall);
            }

            JsonNode args = toolCall.get("function").get("arguments");
            ToolExecutionContext ctx = new ToolExecutionContext(project, agent, completionResponseMessage, parentPreviousMessages, toolDefinition, cancellationToken);
            JsonNode result = aiToolRegistry.execute(toolName, args, ctx);

            AiModelMessage message = new AiModelMessage();
            message.setRole("tool");
            message.setToolCallId(toolCall.get("id").asText());
            message.setName(toolName);
            message.setContent(result.toString());
            toolExecutionMessages.add(message);
        });

        if (!clientToolCalls.isEmpty()) {
            listener.onClientToolCalls(completionResponseMessage, clientToolCalls);
        }
        return toolExecutionMessages;
    }


    public String convertToAiModelTextQuestion(Message message, List<DocumentInstanceSectionDTO> nearestSections, ProjectAgent agent) throws GendoxException {

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

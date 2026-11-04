package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Names a new chat thread from its first question (#549), with the cheapest model of the agent's own
 * provider: the same API key works, and no new model association is needed. Runs beside the answer,
 * never in its way: any failure leaves the thread called "Chat Thread". Its tokens are audited as
 * CHAT_THREAD_NAMING, which does not count as a message of the plan.
 */
@Service
public class ChatThreadNamingService {

    private static final Logger logger = LoggerFactory.getLogger(ChatThreadNamingService.class);

    public static final String DEFAULT_THREAD_NAME = "Chat Thread";
    private static final String AUDIT_TYPE = "COMPLETION_RESPONSE";
    private static final int MAX_QUESTION_LENGTH = 2000;
    private static final int MAX_NAME_LENGTH = 60;
    private static final String INSTRUCTIONS = """
            Write a title of 2 to 4 words that describes the user's message, in the language of the message.
            Answer with the title only: no quotes, no final punctuation, no explanation.""";

    private final AiModelRepository aiModelRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final EmbeddingService embeddingService;
    private final AiModelUtils aiModelUtils;
    private final AuditLogsService auditLogsService;
    private final TypeService typeService;

    public ChatThreadNamingService(AiModelRepository aiModelRepository,
                                   ChatThreadRepository chatThreadRepository,
                                   EmbeddingService embeddingService,
                                   AiModelUtils aiModelUtils,
                                   AuditLogsService auditLogsService,
                                   TypeService typeService) {
        this.aiModelRepository = aiModelRepository;
        this.chatThreadRepository = chatThreadRepository;
        this.embeddingService = embeddingService;
        this.aiModelUtils = aiModelUtils;
        this.auditLogsService = auditLogsService;
        this.typeService = typeService;
    }

    /** Names the thread of {@code question}, unless it was renamed meanwhile. Never throws. */
    public void nameThread(Message question, Project project) {
        try {
            if (question.getValue() == null || question.getValue().isBlank() || project.getProjectAgent() == null) {
                return;
            }
            AiModel model = smallestModelLike(project.getProjectAgent().getCompletionModel().getId(), project.getOrganizationId());
            String apiKey = embeddingService.getApiKey(project.getOrganizationId(), model);
            AiModelMessage message = AiModelMessage.builder()
                    .role("user")
                    .content(truncate(question.getValue(), MAX_QUESTION_LENGTH))
                    .build();
            AiModelRequestParams params = AiModelRequestParams.builder()
                    .maxTokens(1000L)
                    .temperature(0.2)
                    .topP(1.0)
                    .reasoningEffort(model.getDefaultReasoningEffort())
                    .build();

            CompletionResponse response = aiModelUtils.getAiModelApiAdapterImpl(model.getApiType().getName())
                    .askCompletion(List.of(message), INSTRUCTIONS, model, params, apiKey, List.of(), null, null);
            saveAuditLogs(response, project);

            String name = cleanName(response.getChoices().getFirst().getMessage().getContent());
            if (!name.isEmpty()) {
                chatThreadRepository.renameIfStillNamed(question.getThreadId(), name, DEFAULT_THREAD_NAME);
            }
        } catch (Exception e) {
            logger.warn("Could not name thread {}", question.getThreadId(), e);
        }
    }

    /**
     * The cheapest active completion model of the same provider, e.g. Haiku for a Claude agent. This runs off the
     * request's thread, so the models are loaded here with everything the call reads.
     */
    AiModel smallestModelLike(UUID agentModelId, UUID organizationId) throws GendoxException {
        AiModel agentModel = aiModelRepository.findWithDetailsById(agentModelId)
                .orElseThrow(() -> new GendoxException("AI_MODEL_NOT_FOUND", "Model not found: " + agentModelId, HttpStatus.NOT_FOUND));
        Optional<AiModel> cheapest = aiModelRepository
                .findActiveCompletionModelsByProviderCheapestFirst(agentModel.getAiModelProvider().getId(), organizationId)
                .stream()
                .findFirst();
        return cheapest.orElse(agentModel);
    }

    static String cleanName(String raw) {
        if (raw == null) {
            return "";
        }
        String name = raw.strip().lines().findFirst().orElse("")
                .replaceAll("^[\"'`*#\\s]+|[\"'`*.\\s]+$", "")
                .strip();
        return truncate(name, MAX_NAME_LENGTH);
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max).strip();
    }

    // Its own audit type: the tokens are recorded, but a name is not a message of the plan (COMPLETION_RESPONSE is)
    private void saveAuditLogs(CompletionResponse response, Project project) {
        if (response.getUsage() == null) {
            return;
        }
        AuditLogs naming = auditLogsService.createDefaultAuditLogs(typeService.getAuditLogTypeByName(AUDIT_TYPE));
        // TODO review this, probably the input tokens need to be saved separatly
        naming.setTokenCount((long) response.getUsage().getPromptTokens() + response.getUsage().getCompletionTokens());
        naming.setProjectId(project.getId());
        naming.setOrganizationId(project.getOrganizationId());
        auditLogsService.saveAuditLogs(naming);
    }
}

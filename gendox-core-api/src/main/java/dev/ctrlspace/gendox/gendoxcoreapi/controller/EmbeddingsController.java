package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobExecution;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.concurrent.DelegatingSecurityContextRunnable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageLocalContextConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionStatusDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionListener;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionTurnService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationModelKeyService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TrainingService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.spring.batch.services.DeepThinkingBatchService;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;

@RestController
public class EmbeddingsController {

    Logger logger = LoggerFactory.getLogger(EmbeddingsController.class);

    private EmbeddingService embeddingService;
    private TrainingService trainingService;
    private CompletionService completionService;
    private MessageService messageService;
    private OrganizationModelKeyService organizationModelKeyService;
    private SubscriptionValidationService subscriptionValidationService;
    private ProjectService projectService;
    private MessageLocalContextConverter messageLocalContextConverter;
    private MessageLocalContextService messageLocalContextService;
    private DeepThinkingBatchService deepThinkingBatchService;
    private CompletionTurnService completionTurnService;
    private TaskExecutor taskExecutor;

    // Identifies an anonymous chat session when it answers or checks a waiting turn
    private static final String COMPLETION_TOKEN_HEADER = "X-Gendox-Completion-Token";
    private static final String TOOL_ROLE = "tool";

    @Value("${proven-ai.enabled}")
    private Boolean provenAiEnabled;

    @Autowired
    public EmbeddingsController(EmbeddingService embeddingService,
                                TrainingService trainingService,
                                CompletionService completionService,
                                MessageService messageService,
                                OrganizationModelKeyService organizationModelKeyService,
                                SubscriptionValidationService subscriptionValidationService,
                                ProjectService projectService,
                                MessageLocalContextConverter messageLocalContextConverter,
                                MessageLocalContextService messageLocalContextService,
                                DeepThinkingBatchService deepThinkingBatchService,
                                CompletionTurnService completionTurnService,
                                @Qualifier("taskExecutor") TaskExecutor taskExecutor) {
        this.embeddingService = embeddingService;
        this.trainingService = trainingService;
        this.completionService = completionService;
        this.messageService = messageService;
        this.organizationModelKeyService = organizationModelKeyService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.projectService = projectService;
        this.messageLocalContextConverter = messageLocalContextConverter;
        this.messageLocalContextService = messageLocalContextService;
        this.deepThinkingBatchService = deepThinkingBatchService;
        this.completionTurnService = completionTurnService;
        this.taskExecutor = taskExecutor;
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/embeddings/sections/{sectionId}")
    @Operation(summary = "Get section embedding",
            description = "Retrieve the embedding for a specific section in a project based on the provided section ID and project ID. " +
                    "This endpoint calculates and returns the embedding of the text content within the specified section. " +
                    "It also associates the calculated embedding with the section in the database for further analysis.")
    public Embedding getSectionEmbedding(@PathVariable UUID sectionId, @RequestParam String projectId) throws GendoxException, NoSuchAlgorithmException {
        return trainingService.runTrainingForSection(sectionId, UUID.fromString(projectId));
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping("/embeddings/projects/{projectId}")
    @Operation(summary = "Get project embeddings",
            description = "Retrieve embeddings for all sections in a project based on the provided project ID. " +
                    "This endpoint calculates and returns embeddings for all sections within the specified project. " +
                    "It performs the embedding calculation for each section and associates the results with the respective sections.")
    @Observed(name = "EmbeddingsController.getProjectEmbeddings",
            contextualName = "EmbeddingsController#getProjectEmbeddings",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<Embedding> getProjectEmbeddings(@PathVariable UUID projectId) throws GendoxException, NoSuchAlgorithmException {
        return trainingService.runTrainingForProject(projectId);
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/messages/search")
    @Operation(summary = "Semantic search for closer sections",
            description = "Search for sections within a project that are semantically closer to a given message. " +
                    "This endpoint calculates the embedding for the input message and retrieves sections from the specified project " +
                    "that have similar semantic representations.")
    @Observed(name = "EmbeddingsController.findCloserSections",
            contextualName = "EmbeddingsController#findCloserSections",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<DocumentInstanceSectionDTO> findCloserSections(@RequestBody Message message,
                                                               @RequestParam String projectId,
                                                               Authentication authentication,
                                                               HttpServletRequest request,
                                                               Pageable pageable) throws GendoxException, IOException, NoSuchAlgorithmException {

        String requestIP = request.getRemoteAddr();
        subscriptionValidationService.validateRequestIsInSubscriptionLimits(UUID.fromString(projectId), authentication, requestIP);
        Project project = projectService.getProjectById(UUID.fromString(projectId));


        if (pageable == null) {
            pageable = PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue());
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 5", HttpStatus.BAD_REQUEST);
        }

        message.setProjectId(UUID.fromString(projectId));
        message = messageService.createMessage(message);

        List<DocumentInstanceSectionDTO> sections = embeddingService.findClosestSections(message, project, pageable);

        return sections;
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams') || " +
            "@securityUtils.isPublicProject(#projectId)")
    @PostMapping("/messages/completions")
    @Operation(summary = "Semantic completion of message",
            description = "Find a message within a project that semantically completes the given input message. " +
                    "This endpoint calculates the embedding for the input message and searches for a complementary message " +
                    "in the context of the provided project. Set stream=true to receive the answer as Server-Sent Events. " +
                    "A message with role=tool returns the result of a CLIENT tool call (toolCallId, value) to a turn " +
                    "that waits for it; until every waiting call has a result this returns 202 with the turn status.")
    @Observed(name = "EmbeddingsController.getCompletionSearch",
            contextualName = "EmbeddingsController#getCompletionSearch",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public ResponseEntity<?> getCompletionSearch(@RequestBody CompletionRequestDTO completionRequestDTO,
                                                                    @RequestParam String projectId,
                                                                    Authentication authentication,
                                                                    HttpServletRequest request) throws Exception {

        if (TOOL_ROLE.equals(completionRequestDTO.getRole())) {
            return postToolResult(completionRequestDTO, UUID.fromString(projectId), request);
        }

        Project project = projectService.getProjectById(UUID.fromString(projectId));
        // check if the message is within the subscription limits
        if (!subscriptionValidationService.canSendMessage(project.getOrganizationId(), project.getProjectAgent().getCompletionModel())) {
            throw new GendoxException("MAX_MESSAGES_EXCEED", "Maximum messages limit exceeded", HttpStatus.BAD_REQUEST);
        }


        String requestIP = request.getRemoteAddr();
        subscriptionValidationService.validateRequestIsInSubscriptionLimits(UUID.fromString(projectId), authentication, requestIP);

        Message message = new Message();
        message.setValue(completionRequestDTO.getValue());
        message.setThreadId(completionRequestDTO.getThreadId());
        message.setProjectId(UUID.fromString(projectId));
        List<MessageLocalContext> contexts = new ArrayList<>();
        // 1) contexts from request body
        contexts.addAll(
                messageLocalContextConverter.toEntities(message, completionRequestDTO.getLocalContexts())
        );

        // 2) contexts from attached documents
        contexts.addAll(
                messageLocalContextService.buildContextsFromDocumentIds(
                        message,
                        completionRequestDTO.getDocumentInstanceIds(),
                        "ATTACHED_DOCUMENT"
                )
        );
        message.setLocalContexts(contexts);
        Message savedMessage = messageService.createMessage(message);

        List<ContentPart> attachedImages = messageLocalContextService.getImageContentPartsFromLocalContext(message);
        savedMessage.setAdditionalResources(attachedImages);

        CompletionMessageDTO response;
        if (completionRequestDTO.isDeepThinking()) {
            JobExecution jobExecution = deepThinkingBatchService.runDeepThinking(
                    savedMessage.getId(), project.getId(), savedMessage.getThreadId());

            response = CompletionMessageDTO.builder()
                    .jobExecutionId(jobExecution.getId())
                    .threadId(savedMessage.getThreadId())
                    .build();

            return ResponseEntity.accepted().body(response);
        }

        return respond(completionRequestDTO.isStream(), completionRequestDTO.isClientToolResults(), savedMessage,
                listener -> completionService.getCompletionSearch(savedMessage, project, listener));
    }

    /**
     * Saves the result of a CLIENT tool call. The turn continues once every call it waits for has a
     * result; until then the answer is 202 with the turn's status.
     */
    private ResponseEntity<?> postToolResult(CompletionRequestDTO toolResult, UUID projectId, HttpServletRequest request) throws Exception {
        String resumeToken = request.getHeader(COMPLETION_TOKEN_HEADER);
        Optional<CompletionTurn> resumed = completionTurnService.saveResult(toolResult.getThreadId(), toolResult.getToolCallId(),
                toolResult.getValue(), projectId, resumeToken);
        if (resumed.isEmpty()) {
            return ResponseEntity.accepted().body(completionTurnService.getStatus(toolResult.getThreadId(), resumeToken));
        }

        CompletionTurn turn = resumed.get();
        Message question = messageService.getMessageById(turn.getUserMessageId());
        return respond(toolResult.isStream(), true, question, listener -> completionService.resumeCompletionSearch(turn, listener));
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') || @securityUtils.isPublicThread(#threadId)")
    @GetMapping("/threads/{threadId}/completion-status")
    @Operation(summary = "Get the status of a thread's latest chat turn",
            description = "IDLE, GENERATING or WAITING_FOR_TOOLS, with the calls a waiting turn needs results for. " +
                    "Lets a reloaded page show a turn that is still running.")
    public CompletionStatusDTO getCompletionStatus(@PathVariable UUID threadId, HttpServletRequest request) {
        return completionTurnService.getStatus(threadId, request.getHeader(COMPLETION_TOKEN_HEADER));
    }

    /**
     * Answers with JSON, or with Server-Sent Events while the completion runs in the background,
     * where it continues even if the browser goes away.
     */
    private ResponseEntity<?> respond(boolean stream, boolean waitsForClientTools, Message question,
                                      SseCompletionListener.ChatCompletion completion) throws Exception {
        if (!stream) {
            return ResponseEntity.ok(completion.run(new CompletionListener(waitsForClientTools)));
        }

        SseCompletionListener events = new SseCompletionListener(question, waitsForClientTools);
        taskExecutor.execute(new DelegatingSecurityContextRunnable(() -> events.run(completion)));
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .header("Cache-Control", "no-cache, no-transform")
                .header("X-Accel-Buffering", "no")
                .body(events.getEmitter());
    }


    @PostMapping("/messages/moderation")
    public ModerationResponse getModerationCheck(@RequestBody String message) throws GendoxException {
        String moderationApiKey = organizationModelKeyService.getDefaultKeyForAgent(null, "MODERATION_MODEL");
        AiModel aiModel = new AiModel();
        aiModel.setName("OPENAI_MODERATION");
        ModerationResponse moderationResponse = trainingService.getModeration(message, moderationApiKey, aiModel);
        return moderationResponse;
    }

    @PostMapping("/messages/moderation/document")
    public Map<Map<String, Boolean>, String> getModerationForDocumentSections(@RequestParam UUID documentId) throws GendoxException {

        return trainingService.getModerationForDocumentSections(documentId);
    }


}

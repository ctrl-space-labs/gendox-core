package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceSectionWithDocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class EmbeddingsController {

    Logger logger = LoggerFactory.getLogger(EmbeddingsController.class);


    private EmbeddingRepository embeddingRepository;
    private EmbeddingService embeddingService;
    private TrainingService trainingService;
    private CompletionService completionService;
    private MessageService messageService;

    private OrganizationPlanService organizationPlanService;

    private DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter;



    @Value("${proven-ai.enabled}")
    private Boolean provenAiEnabled;

    @Autowired
    public EmbeddingsController(EmbeddingRepository embeddingRepository,
                                EmbeddingService embeddingService,
                                TrainingService trainingService,
                                CompletionService completionService,
                                DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter,
                                MessageService messageService,
                                OrganizationPlanService organizationPlanService
    ) {
        this.embeddingRepository = embeddingRepository;
        this.embeddingService = embeddingService;
        this.trainingService = trainingService;
        this.completionService = completionService;
        this.messageService = messageService;
        this.documentInstanceSectionWithDocumentConverter = documentInstanceSectionWithDocumentConverter;
        this.organizationPlanService = organizationPlanService;
    }

    @PostMapping("/embeddings")
    @Operation(summary = "Get embeddings",
            description = "Retrieve embeddings for a given text input using an AI model. " +
                    "This endpoint accepts a BotRequest containing the text input and returns an Ada2Response " +
                    "containing the embeddings for the input text. Additionally, it stores the embeddings in the database " +
                    "as an Embedding entity with a unique ID.")
    @Observed(name = "EmbeddingsController.getEmbeddings",
            contextualName = "EmbeddingsController#getEmbeddings",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public EmbeddingResponse getEmbeddings(@RequestBody BotRequest botRequest, @RequestParam String aiModel) throws GendoxException {

        AiModel aiModelObj = new AiModel();
        aiModelObj.setModel(aiModel);
        EmbeddingResponse embeddingResponse = embeddingService.getEmbeddingForMessage(botRequest, aiModelObj);
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(embeddingResponse.getData().get(0).getEmbedding());
        embedding.setId(UUID.randomUUID());

        embedding = embeddingRepository.save(embedding);

        return embeddingResponse;
    }




    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/embeddings/sections/{sectionId}")
    @Operation(summary = "Get section embedding",
            description = "Retrieve the embedding for a specific section in a project based on the provided section ID and project ID. " +
                    "This endpoint calculates and returns the embedding of the text content within the specified section. " +
                    "It also associates the calculated embedding with the section in the database for further analysis.")
    public Embedding getSectionEmbedding(@PathVariable UUID sectionId, @RequestParam String projectId) throws GendoxException {
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
    public List<Embedding> getProjectEmbeddings(@PathVariable UUID projectId) throws GendoxException {
        return trainingService.runTrainingForProject(projectId);
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/messages/semantic-search")
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
                                                            Pageable pageable) throws GendoxException, IOException {

        String requestIP = request.getRemoteAddr();
        organizationPlanService.validateRequestIsInSubscriptionLimits(UUID.fromString(projectId), authentication, requestIP);


        if (pageable == null) {
            pageable = PageRequest.of(0, 5);
        }
        if (pageable.getPageSize() > 20) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 5", HttpStatus.BAD_REQUEST);
        }

        message.setProjectId(UUID.fromString(projectId));
        message = messageService.createMessage(message);

        List<DocumentInstanceSectionDTO> sections = embeddingService.findClosestSections(message, UUID.fromString(projectId));

//        List<DocumentInstanceSectionDTO> sections = instanceSections
//                .stream()
//                .map(section -> documentInstanceSectionWithDocumentConverter.toDTO(section))
//                .toList();
        return sections;
    }







    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/messages/semantic-completion")
    @Operation(summary = "Semantic completion of message",
            description = "Find a message within a project that semantically completes the given input message. " +
                    "This endpoint calculates the embedding for the input message and searches for a complementary message " +
                    "in the context of the provided project.")
    @Observed(name = "EmbeddingsController.getCompletionSearch",
            contextualName = "EmbeddingsController#getCompletionSearch",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public CompletionMessageDTO getCompletionSearch(@RequestBody Message message,
                                                    @RequestParam String projectId,
                                                    Authentication authentication,
                                                    HttpServletRequest request) throws GendoxException, IOException {

        String requestIP = request.getRemoteAddr();
        organizationPlanService.validateRequestIsInSubscriptionLimits(UUID.fromString(projectId), authentication, requestIP);

        message.setProjectId(UUID.fromString(projectId));
        message = messageService.createMessage(message);

//        sections.stream()
//                .map(DocumentInstanceSectionDTO::getDocumentUrl)
//                .collect(Collectors.toList());
//
//        List<Integer> tokens = sections.stream()
//                .map(DocumentInstanceSectionDTO::getTokens)
//                .collect(Collectors.toList())

        List<DocumentInstanceSectionDTO> sections = embeddingService.findClosestSections(message, UUID.fromString(projectId));


        if (provenAiEnabled) {
            try {
                List<DocumentInstanceSectionDTO> provenAiSections = embeddingService.findProvenAiClosestSections(message, UUID.fromString(projectId));
                sections.addAll(provenAiSections);
            } catch (GendoxException e) {
                // swallow exception
                if ("PROVENAI_AGENT_NOT_FOUND".equals(e.getErrorCode())) {
                    logger.debug("ProvenAI agent not found");
                } else {
                    throw e;
                }
            }
        }

        List<DocumentInstanceSection> instanceSections = sections.stream()
                .map(dto -> documentInstanceSectionWithDocumentConverter.toEntity(dto))
                .toList();


        Message completion = completionService.getCompletion(message, instanceSections, UUID.fromString(projectId));

        List<MessageSection> messageSections = messageService.createMessageSections(instanceSections, completion);

        completion = messageService.updateMessageWithSections(completion, messageSections);

        CompletionMessageDTO completionMessageDTO = CompletionMessageDTO.builder()
                .message(completion)
                .threadID(message.getThreadId())
                .sectionId(instanceSections.stream().map(DocumentInstanceSection::getId).toList())
                .tokens(sections.stream().map(DocumentInstanceSectionDTO::getTokenCount).toList())
                .iscc(sections.stream().map(DocumentInstanceSectionDTO::getDocumentSectionIsccCode).toList())
                .documentURL(sections.stream().map(DocumentInstanceSectionDTO::getDocumentURL).toList())
                .ownerName(sections.stream().map(DocumentInstanceSectionDTO::getOwnerName).toList())
                .title(sections.stream()
                        .map(section -> section.getDocumentSectionMetadata().getTitle()).toList())
                .signedPermissionOfUseVc(sections.stream()
                        .map(DocumentInstanceSectionDTO::getSignedPermissionOfUseVc).toList())
                .aiModelName(sections.stream()
                        .map(DocumentInstanceSectionDTO::getAiModelName).toList())

                .build();


        return completionMessageDTO;
    }




    @PostMapping("/messages/moderation")
    public OpenAiGpt35ModerationResponse getModerationCheck(@RequestBody String message) throws GendoxException {
        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(message);
        return openAiGpt35ModerationResponse;
    }

    @PostMapping("/messages/moderation/document")
    public Map<Map<String, Boolean>, String> getModerationForDocumentSections(@RequestParam UUID documentId) throws GendoxException {
        return trainingService.getModerationForDocumentSections(documentId);
    }




}

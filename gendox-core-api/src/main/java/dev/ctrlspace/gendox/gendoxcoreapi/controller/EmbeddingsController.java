package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceSectionWithDocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProvenAiMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.services.SubscriptionValidationService;
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
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class EmbeddingsController {

    Logger logger = LoggerFactory.getLogger(EmbeddingsController.class);

    private EmbeddingService embeddingService;
    private TrainingService trainingService;
    private CompletionService completionService;
    private MessageService messageService;
    private DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter;
    private OrganizationModelKeyService organizationModelKeyService;
    private SubscriptionValidationService subscriptionValidationService;
    private ProjectService projectService;
    private RerankService rerankService;


    @Value("${proven-ai.enabled}")
    private Boolean provenAiEnabled;

    @Autowired
    public EmbeddingsController(EmbeddingService embeddingService,
                                TrainingService trainingService,
                                CompletionService completionService,
                                DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter,
                                MessageService messageService,
                                OrganizationModelKeyService organizationModelKeyService,
                                SubscriptionValidationService subscriptionValidationService,
                                ProjectService projectService,
                                RerankService rerankService
    ) {
        this.embeddingService = embeddingService;
        this.trainingService = trainingService;
        this.completionService = completionService;
        this.messageService = messageService;
        this.documentInstanceSectionWithDocumentConverter = documentInstanceSectionWithDocumentConverter;
        this.organizationModelKeyService = organizationModelKeyService;
        this.subscriptionValidationService = subscriptionValidationService;
        this.projectService = projectService;
        this.rerankService = rerankService;
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

//        List<DocumentInstanceSectionDTO> sections = instanceSections
//                .stream()
//                .map(section -> documentInstanceSectionWithDocumentConverter.toDTO(section))
//                .toList();
        return sections;
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams') || " +
            "@securityUtils.isPublicProject(#projectId)")
    @PostMapping("/messages/completions")
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
                                                    HttpServletRequest request) throws GendoxException, IOException, NoSuchAlgorithmException {

        Project project = projectService.getProjectById(UUID.fromString(projectId));
        // check if the message is within the subscription limits
        if (!subscriptionValidationService.canSendMessage(project.getOrganizationId())) {
            throw new GendoxException("MAX_MESSAGES_EXCEED", "Maximum messages limit exceeded", HttpStatus.BAD_REQUEST);
        }


        String requestIP = request.getRemoteAddr();
        subscriptionValidationService.validateRequestIsInSubscriptionLimits(UUID.fromString(projectId), authentication, requestIP);

        message.setProjectId(UUID.fromString(projectId));
        Message savedMessage = messageService.createMessage(message);

        //TODO: this is a hack. save local context ot DB
        savedMessage.setLocalContexts(message.getLocalContexts());
        message = savedMessage;

        // search and rerank sections
        List<DocumentInstanceSectionDTO> sectionDTOs = embeddingService.findClosestSections(
                message,
                project,
                PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue())
        );



        int maxCompletionLimit = project.getProjectAgent().getMaxCompletionLimit().intValue();

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();
        List<DocumentInstanceSectionDTO> searchHistorySections = new ArrayList<>();
        for (int i = 0; i < sectionDTOs.size(); i++) {
            DocumentInstanceSectionDTO section = sectionDTOs.get(i);
            if (i < maxCompletionLimit) {
                topSectionsForCompletion.add(section);
            } else {
                searchHistorySections.add(section);
            }
        }


        List<Message> completions = completionService.getCompletion(message, topSectionsForCompletion, UUID.fromString(projectId));

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

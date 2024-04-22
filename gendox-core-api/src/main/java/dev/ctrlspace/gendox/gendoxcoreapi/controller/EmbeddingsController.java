package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TrainingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class EmbeddingsController {

    private EmbeddingRepository embeddingRepository;
    private EmbeddingService embeddingService;
    private TrainingService trainingService;
    private CompletionService completionService;
    private MessageService messageService;

    @Autowired
    public EmbeddingsController(EmbeddingRepository embeddingRepository,
                                EmbeddingService embeddingService,
                                TrainingService trainingService,
                                CompletionService completionService,
                                MessageService messageService
    ) {
        this.embeddingRepository = embeddingRepository;
        this.embeddingService = embeddingService;
        this.trainingService = trainingService;
        this.completionService = completionService;
        this.messageService = messageService;
    }

    @PostMapping("/embeddings")
    @Operation(summary = "Get embeddings",
            description = "Retrieve embeddings for a given text input using an AI model. " +
                    "This endpoint accepts a BotRequest containing the text input and returns an Ada2Response " +
                    "containing the embeddings for the input text. Additionally, it stores the embeddings in the database " +
                    "as an Embedding entity with a unique ID.")
    public EmbeddingResponse getEmbeddings(@RequestBody BotRequest botRequest, @RequestParam String aiModel) throws GendoxException {

        EmbeddingResponse embeddingResponse = embeddingService.getEmbeddingForMessage(botRequest, aiModel);
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

    public List<Embedding> getProjectEmbeddings(@PathVariable UUID projectId) throws GendoxException {
        return trainingService.runTrainingForProject(projectId);
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/messages/semantic-search")
    @Operation(summary = "Semantic search for closer sections",
            description = "Search for sections within a project that are semantically closer to a given message. " +
                    "This endpoint calculates the embedding for the input message and retrieves sections from the specified project " +
                    "that have similar semantic representations.")
    public List<DocumentInstanceSection> findCloserSections(@RequestBody Message message,
                                                            @RequestParam String projectId,
                                                            Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 5);
        }
        if (pageable.getPageSize() > 5) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 5", HttpStatus.BAD_REQUEST);
        }

        message = messageService.createMessage(message);

        List<DocumentInstanceSection> instanceSections = new ArrayList<>();
        instanceSections = embeddingService.findClosestSections(message, UUID.fromString(projectId));

        return instanceSections;
    }


    @PreAuthorize(" @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @PostMapping("/messages/semantic-completion")
    @Operation(summary = "Semantic completion of message",
            description = "Find a message within a project that semantically completes the given input message. " +
                    "This endpoint calculates the embedding for the input message and searches for a complementary message " +
                    "in the context of the provided project.")
    public CompletionMessageDTO getCompletionSearch(@RequestBody Message message,
                                                    @RequestParam String projectId) throws GendoxException {


        message.setProjectId(UUID.fromString(projectId));
        message = messageService.createMessage(message);

        List<DocumentInstanceSection> instanceSections = embeddingService.findClosestSections(message, UUID.fromString(projectId));

        Message completion = completionService.getCompletion(message, instanceSections, UUID.fromString(projectId));

        List<MessageSection> messageSections = messageService.createMessageSections(instanceSections, completion);

        completion = messageService.updateMessageWithSections(completion, messageSections);

        CompletionMessageDTO completionMessageDTO = CompletionMessageDTO.builder()
                .message(completion)
                .sectionId(instanceSections.stream().map(DocumentInstanceSection::getId).toList())
                .threadID(message.getThreadId())
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

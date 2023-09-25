package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageDto;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.EmbeddingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class EmbeddingsController {

    private EmbeddingRepository embeddingRepository;
    private EmbeddingService embeddingService;


    @Autowired
    private AiModelService aiModelService;


    @Autowired
    public EmbeddingsController(EmbeddingRepository embeddingRepository,
                                EmbeddingService embeddingService) {
        this.embeddingRepository = embeddingRepository;
        this.embeddingService = embeddingService;

    }

    @PostMapping("/embeddings")
    public Ada2Response getEmbeddings(@RequestBody BotRequest botRequest) {
        Ada2Response ada2Response = aiModelService.askEmbedding(botRequest);
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(ada2Response.getData().get(0).getEmbedding());
        embedding.setId(UUID.randomUUID());

        embedding = embeddingRepository.save(embedding);

        return ada2Response;
    }


    @PostMapping("/embeddings/sections/{sectionId}")
    public Embedding getSectionEmbedding(@PathVariable UUID sectionId) throws GendoxException {
        return embeddingService.createSectionsEmbedding(sectionId);
    }

    @PostMapping("/embeddings/projects/{projectId}")
    public List<Embedding> getProjectEmbeddings(@PathVariable UUID projectId) throws GendoxException {
        return embeddingService.createProjectEmbeddings(projectId);
    }

    @PostMapping("/messages/semantic-search")
    public List<DocumentInstanceSection> findCloserSections(@RequestBody Message message, Pageable pageable) throws GendoxException{
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        message.setId(UUID.randomUUID());
        message = embeddingService.createMessage(message);


        List<DocumentInstanceSection> instanceSections = new ArrayList<>();
        instanceSections = embeddingService.findCloserSections(message, pageable);

        return instanceSections;
    }


}

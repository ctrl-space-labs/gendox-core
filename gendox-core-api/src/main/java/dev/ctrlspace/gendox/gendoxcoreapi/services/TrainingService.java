package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentInstanceSectionCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingGroupRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.DocumentInstanceSectionPredicates;
import lombok.NonNull;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.*;

import org.slf4j.Logger;

@Service
public class TrainingService {

    Logger logger = LoggerFactory.getLogger(TrainingService.class);

    private DocumentInstanceSectionRepository sectionRepository;
    private DocumentSectionService documentSectionService;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private EmbeddingService embeddingService;
    private ProjectDocumentRepository projectDocumentRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private AiModelService aiModelService;

    @Lazy
    @Autowired
    public void setEmbeddingService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Lazy
    @Autowired
    public void setEmbeddingService(DocumentSectionService documentSectionService) {
        this.documentSectionService = documentSectionService;
    }


    @Autowired
    public TrainingService(DocumentInstanceSectionRepository sectionRepository,
                           EmbeddingGroupRepository embeddingGroupRepository,
                           ProjectDocumentRepository projectDocumentRepository,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           AiModelService aiModelService) {
        this.sectionRepository = sectionRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.projectDocumentRepository = projectDocumentRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.aiModelService = aiModelService;
    }


    public Embedding runTrainingForSection(UUID sectionId, UUID projectId) throws GendoxException {
        DocumentInstanceSection section = documentSectionService.getSectionById(sectionId);
        return this.runTrainingForSection(section, projectId);
    }

    public Embedding runTrainingForSection(@NonNull DocumentInstanceSection section, UUID projectId) throws GendoxException {
        Ada2Response ada2Response = embeddingService.getAda2EmbeddingForMessage(section.getSectionValue());
        Embedding embedding = embeddingService.upsertEmbeddingForText(ada2Response, projectId, null, section.getId());


        return embedding;
    }

    public List<Embedding> runTrainingForProject(UUID projectId) throws GendoxException {
        List<Embedding> projectEmbeddings = new ArrayList<>();
        List<DocumentInstance> documentInstances = new ArrayList<>();
        List<UUID> instanceIds = new ArrayList<>();
        instanceIds = projectDocumentRepository.findDocumentIdsByProjectId(projectId);
        documentInstances = projectDocumentRepository.findDocumentInstancesByDocumentIds(instanceIds);

        for (DocumentInstance instance : documentInstances) {
            List<DocumentInstanceSection> instanceSections = new ArrayList<>();
            instanceSections = sectionRepository.findByDocumentInstance(instance.getId());
            for (DocumentInstanceSection section : instanceSections) {
                Embedding embedding = new Embedding();
                embedding = runTrainingForSection(section, projectId);
                projectEmbeddings.add(embedding);
            }
        }

        return projectEmbeddings;
    }

    public Gpt35ModerationResponse getModeration(String message) {
        Gpt35ModerationResponse moderationResponse = aiModelService.moderationCheck(message);
        return moderationResponse;
    }

    public Map<Map<String, Boolean>, String> getModerationForDocumentSections(UUID documentInstanceId) throws GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
        Map<Map<String, Boolean>, String> isFlaggedSections = new HashMap<>();

        for (DocumentInstanceSection section : documentInstanceSections) {
            Gpt35ModerationResponse moderationResponse = getModeration(section.getSectionValue());
            if (moderationResponse.getResults().get(0).isFlagged()) {
                isFlaggedSections.put(moderationResponse.getResults().get(0).getCategories(), section.getSectionValue());
            }
        }
        return isFlaggedSections;
    }

}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingGroupRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import lombok.NonNull;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;

@Service
public class TrainingService {

    Logger logger = LoggerFactory.getLogger(TrainingService.class);

    private DocumentInstanceSectionRepository sectionRepository;
    private DocumentService documentService;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private EmbeddingService embeddingService;
    private ProjectDocumentRepository projectDocumentRepository;


    @Autowired
    public TrainingService(DocumentInstanceSectionRepository sectionRepository,
                           EmbeddingGroupRepository embeddingGroupRepository,
                           EmbeddingService embeddingService,
                           DocumentService documentService,
                           ProjectDocumentRepository projectDocumentRepository) {
        this.sectionRepository = sectionRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.embeddingService = embeddingService;
        this.projectDocumentRepository = projectDocumentRepository;
        this.documentService = documentService;
    }

    public Embedding runTrainingForSection(UUID sectionId, UUID projectId) throws GendoxException {
        DocumentInstanceSection section = documentService.getSectionById(sectionId);
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

}

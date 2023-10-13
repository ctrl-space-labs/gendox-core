package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Embedding;
import dev.ctrlspace.gendox.gendoxcoreapi.model.EmbeddingGroup;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.EmbeddingGroupRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;

@Service
public class TrainingService {

    Logger logger = LoggerFactory.getLogger(TrainingService.class);

    private DocumentInstanceSectionRepository sectionRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private EmbeddingService embeddingService;
    private ProjectDocumentRepository projectDocumentRepository;


    @Autowired
    public TrainingService(DocumentInstanceSectionRepository sectionRepository,
                           EmbeddingGroupRepository embeddingGroupRepository,
                           EmbeddingService embeddingService,
                           ProjectDocumentRepository projectDocumentRepository) {
        this.sectionRepository = sectionRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.embeddingService = embeddingService;
        this.projectDocumentRepository = projectDocumentRepository;
    }


    public Embedding runTrainingForSection(UUID sectionId, UUID projectId) throws GendoxException {

        // Use Optional to handle the result of findById
        Optional<DocumentInstanceSection> optionalSection = sectionRepository.findById(sectionId);

        if (optionalSection.isPresent()) {
            DocumentInstanceSection section = optionalSection.get();

            Embedding embedding = new Embedding();
            embedding = embeddingService.calculateEmbeddingForText(section.getSectionValue(), projectId);

            EmbeddingGroup embeddingGroup = embeddingGroupRepository.findByEmbeddingId(embedding.getId());
            embeddingGroup.setSectionId(sectionId);
            embeddingGroup = embeddingGroupRepository.save(embeddingGroup);

            return embedding;
        } else {
            throw new GendoxException("SECTION_NOT_FOUND", "Section with ID" + sectionId + " not found", HttpStatus.NOT_FOUND);
        }
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
                embedding = runTrainingForSection(section.getId(), projectId);
                projectEmbeddings.add(embedding);
            }
        }

        return projectEmbeddings;
    }

}

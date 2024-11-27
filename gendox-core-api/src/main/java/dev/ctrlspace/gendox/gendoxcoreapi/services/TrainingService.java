package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.EmbeddingTemplateAuthor;
import lombok.NonNull;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.security.NoSuchAlgorithmException;
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
    private EmbeddingService embeddingService;
    private ProjectDocumentRepository projectDocumentRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    private AiModelUtils aiModelUtils;
    private ProjectService projectService;
    private OrganizationModelKeyService organizationModelKeyService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private CryptographyUtils cryptographyUtils;
    private DocumentUtils documentUtils;


    @Lazy
    @Autowired
    public void setEmbeddingService(EmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    @Lazy
    @Autowired
    public void setDocumentSectionService(DocumentSectionService documentSectionService) {
        this.documentSectionService = documentSectionService;
    }


    @Autowired
    public TrainingService(DocumentInstanceSectionRepository sectionRepository,
                           ProjectDocumentRepository projectDocumentRepository,
                           DocumentInstanceSectionRepository documentInstanceSectionRepository,
                           AiModelUtils aiModelUtils,
                           ProjectService projectService,
                           OrganizationModelKeyService organizationModelKeyService,
                           ProjectAgentRepository projectAgentRepository,
                           TemplateRepository templateRepository,
                           CryptographyUtils cryptographyUtils,
                           DocumentUtils documentUtils) {
        this.sectionRepository = sectionRepository;
        this.projectDocumentRepository = projectDocumentRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
        this.projectService = projectService;
        this.aiModelUtils = aiModelUtils;
        this.organizationModelKeyService = organizationModelKeyService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.cryptographyUtils = cryptographyUtils;
        this.documentUtils = documentUtils;
    }


    public Embedding runTrainingForSection(UUID sectionId, UUID projectId) throws GendoxException, NoSuchAlgorithmException {
        DocumentInstanceSection section = documentSectionService.getSectionById(sectionId);
        return this.runTrainingForSection(section, projectId);
    }

    public Embedding runTrainingForSection(@NonNull DocumentInstanceSection section, UUID projectId) throws GendoxException, NoSuchAlgorithmException {
        Project project = projectService.getProjectById(projectId);

        // Create an instance of EmbeddingTemplateAuthor
        EmbeddingTemplateAuthor embeddingTemplateAuthor = new EmbeddingTemplateAuthor();

        ProjectAgent agent = projectAgentRepository.findByProjectId(projectId);

        Template agentSectionTemplate = templateRepository.findByIdIs(agent.getSectionTemplateId());

        String sectionValue = embeddingTemplateAuthor.sectionValueForEmbedding(
                section,
                documentUtils.extractDocumentNameFromUrl(section.getDocumentInstance().getRemoteUrl()),
                agentSectionTemplate.getText() // Pass the template text here
        );

        logger.trace("Section value with template for embedding: {}", sectionValue);

        EmbeddingResponse embeddingResponse = embeddingService.getEmbeddingForMessage(project.getProjectAgent(),
                sectionValue,
                project.getProjectAgent().getSemanticSearchModel());

        String sectionSha256Hash = cryptographyUtils.calculateSHA256(sectionValue);

        Embedding embedding = embeddingService.upsertEmbeddingForText(embeddingResponse, projectId, null, section.getId(), project.getProjectAgent().getSemanticSearchModel().getId(), project.getOrganizationId(),sectionSha256Hash);


        return embedding;
    }

    public List<Embedding> runTrainingForProject(UUID projectId) throws GendoxException, NoSuchAlgorithmException {
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

    public OpenAiGpt35ModerationResponse getModeration(String message, String apiKey) throws GendoxException {
        AiModel aiModel = new AiModel();
        aiModel.setName("OPENAI_MODERATION");
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl("OPEN_AI_API");
        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = aiModelApiAdapterService.moderationCheck(message, apiKey);
        return openAiGpt35ModerationResponse;
    }

    public Map<Map<String, Boolean>, String> getModerationForDocumentSections(UUID documentInstanceId) throws GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = documentInstanceSectionRepository.findByDocumentInstance(documentInstanceId);
        Map<Map<String, Boolean>, String> isFlaggedSections = new HashMap<>();
        String moderationApiKey = organizationModelKeyService.getDefaultKeyForAgent(null, "MODERATION_MODEL");

        for (DocumentInstanceSection section : documentInstanceSections) {
            OpenAiGpt35ModerationResponse moderationResponse = getModeration(section.getSectionValue(), moderationApiKey);
            if (moderationResponse.getResults().get(0).isFlagged()) {
                isFlaggedSections.put(moderationResponse.getResults().get(0).getCategories(), section.getSectionValue());
            }
        }
        return isFlaggedSections;
    }

}

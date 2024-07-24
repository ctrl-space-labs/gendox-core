package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.AiModelEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceSectionWithDocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.SearchResultConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SectionDistanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SearchResult;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.provenAi.utils.ProvenAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.annotation.Nullable;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmbeddingService {

    Logger logger = LoggerFactory.getLogger(EmbeddingService.class);


    private EmbeddingRepository embeddingRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private TypeService typeService;
    private AiModelEmbeddingConverter aiModelEmbeddingConverter;
    private SecurityUtils securityUtils;
    private DocumentSectionService documentSectionService;
    private AiModelUtils aiModelUtils;
    private ProjectService projectService;

    private ProvenAiService provenAiService;

    private SearchResultConverter searchResultConverter;

    private DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter;

    private ProjectAgentService projectAgentService;


    @Autowired
    public EmbeddingService(
            EmbeddingRepository embeddingRepository,
            AuditLogsRepository auditLogsRepository,
            EmbeddingGroupRepository embeddingGroupRepository,
            TypeService typeService,
            SecurityUtils securityUtils,
            DocumentSectionService documentSectionService,
            AiModelEmbeddingConverter aiModelEmbeddingConverter,
            AiModelUtils aiModelUtils,
            ProjectService projectService,
            ProjectAgentService projectAgentService,
            ProvenAiService provenAiService,
            DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter,
            SearchResultConverter searchResultConverter
    ) {
        this.embeddingRepository = embeddingRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.typeService = typeService;
        this.securityUtils = securityUtils;
        this.documentSectionService = documentSectionService;
        this.aiModelUtils = aiModelUtils;
        this.projectService = projectService;
        this.aiModelEmbeddingConverter = aiModelEmbeddingConverter;
        this.provenAiService = provenAiService;
        this.documentInstanceSectionWithDocumentConverter = documentInstanceSectionWithDocumentConverter;
        this.searchResultConverter = searchResultConverter;
        this.projectAgentService = projectAgentService;
    }

    public Embedding createEmbedding(Embedding embedding) throws GendoxException {

        if (embedding.getId() != null) {
            throw new GendoxException("NEW_EMBEDDING_ID_IS_NOT_NULL", "Embedding id must be null", HttpStatus.BAD_REQUEST);
        }
        embedding.setId(UUID.randomUUID());


        embedding = embeddingRepository.save(embedding);
        return embedding;

    }

    /**
     * It creates or update the embedding and the embedding group
     * Logs to audit logs
     *
     * @param embeddingResponse the actual embedding
     * @param projectId         the project/Agent that is involved
     * @return
     * @throws GendoxException
     */

    public Embedding upsertEmbeddingForText(EmbeddingResponse embeddingResponse, UUID projectId, @Nullable UUID messageId, @Nullable UUID sectionId) throws GendoxException {

        Type embeddingType = typeService.getAuditLogTypeByName("EMBEDDING_REQUEST");
        AuditLogs auditLogs = new AuditLogs();
        auditLogs = createAuditLogs(projectId, (long) embeddingResponse.getUsage().getTotalTokens(), embeddingType);

        Embedding embedding = null;
        Optional<EmbeddingGroup> optionalEmbeddingGroup = embeddingGroupRepository.findBySectionIdOrMessageId(sectionId, messageId);

        if (optionalEmbeddingGroup.isPresent()) {

            EmbeddingGroup embeddingGroup = optionalEmbeddingGroup.get();
            embedding = embeddingRepository.findById(embeddingGroup.getEmbeddingId()).get();

            embedding.setEmbeddingVector(embeddingResponse.getData().get(0).getEmbedding());


            embeddingGroup.setEmbeddingId(embedding.getId());
            embeddingGroup.setTokenCount((double) embeddingResponse.getUsage().getTotalTokens());
            embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());

            Project project = projectService.getProjectById(projectId);
            embeddingGroup.setSemanticSearchModelId(project.getProjectAgent().
                    getSemanticSearchModel().getId());


            embeddingRepository.save(embedding);
            embeddingGroupRepository.save(embeddingGroup);
        } else {
            embedding = aiModelEmbeddingConverter.toEntity(embeddingResponse);
            embedding = createEmbedding(embedding);


            EmbeddingGroup group = createEmbeddingGroup(embedding.getId(), Double.valueOf(embeddingResponse.getUsage().getTotalTokens()), messageId, sectionId, projectId);

        }

        return embedding;
    }


    public EmbeddingResponse getEmbeddingForMessage(String value, AiModel aiModel) throws GendoxException {
        return this.getEmbeddingForMessage(Arrays.asList(value), aiModel);
    }


    public EmbeddingResponse getEmbeddingForMessage(List<String> value, AiModel aiModel) throws GendoxException {
        BotRequest botRequest = new BotRequest();
        botRequest.setMessages(value);
        return this.getEmbeddingForMessage(botRequest, aiModel);
    }

    public EmbeddingResponse getEmbeddingForMessage(BotRequest botRequest, AiModel aiModel) throws GendoxException {
        AiModelTypeService aiModelTypeService = aiModelUtils.getAiModelServiceImplementation(aiModel);
        EmbeddingResponse embeddingResponse = aiModelTypeService.askEmbedding(botRequest, aiModel.getModel());

        return embeddingResponse;
    }


    public AuditLogs createAuditLogs(UUID projectId, Long tokenCount, Type auditType) {
        AuditLogs auditLog = new AuditLogs();
        auditLog.setUserId(securityUtils.getUserId());
        auditLog.setProjectId(projectId);
        auditLog.setTokenCount(tokenCount);
        auditLog.setType(auditType);

        auditLog = auditLogsRepository.save(auditLog);

        return auditLog;
    }


    public EmbeddingGroup createEmbeddingGroup(UUID embeddingId, Double tokenCount, UUID message_id, UUID sectionId, UUID projectId) throws GendoxException {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(UUID.randomUUID());
        embeddingGroup.setEmbeddingId(embeddingId);
        embeddingGroup.setTokenCount(tokenCount);
        embeddingGroup.setSectionId(sectionId);

        embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
        Project project = projectService.getProjectById(projectId);

        embeddingGroup.setSemanticSearchModelId(project.getProjectAgent().getSemanticSearchModel().getId());
        embeddingGroup.setMessageId(message_id);


        embeddingGroup = embeddingGroupRepository.save(embeddingGroup);

        return embeddingGroup;
    }


    public void deleteEmbeddings(List<Embedding> embeddings) throws GendoxException {
        embeddingRepository.deleteAll(embeddings);

    }

    public void deleteEmbedding(UUID embeddingId) throws GendoxException {
        embeddingRepository.deleteById(embeddingId);
    }

    public void deleteEmbeddingGroup(UUID embeddingGroupId) throws GendoxException {
        embeddingGroupRepository.deleteById(embeddingGroupId);
    }

    public void deleteEmbeddingGroupsBySection(UUID sectionId) throws GendoxException {
        List<EmbeddingGroup> embeddingGroups = embeddingGroupRepository.findBySectionId(sectionId);

        List<UUID> embeddingGroupIds = embeddingGroups.stream().map(emb -> emb.getId()).collect(Collectors.toList());
        List<UUID> embeddingIds = embeddingGroups.stream().map(emb -> emb.getEmbeddingId()).collect(Collectors.toList());

        embeddingGroupRepository.deleteAllById(embeddingGroupIds);
        embeddingRepository.deleteAllById(embeddingIds);
    }

    /**
     * Get an Embedding and returns the nearest Embeddings for this specific project
     *
     * @param embedding
     * @param projectId
     * @param pageRequest
     * @return
     * @throws GendoxException
     */
    public List<SectionDistanceDTO> findNearestEmbeddings(Embedding embedding, UUID projectId, PageRequest pageRequest) throws GendoxException, IOException {
        List<SectionDistanceDTO> nearestEmbeddings = new ArrayList<>();

        StringBuilder sb = new StringBuilder("[");
        sb.append(embedding.getEmbeddingVector().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        sb.append("]");

        nearestEmbeddings = embeddingRepository.findClosestSectionIdsWithDistance(projectId, sb.toString(), pageRequest.getPageSize());

        return nearestEmbeddings;
    }


    public List<DocumentInstanceSectionDTO> findClosestSections(Message message, UUID projectId) throws GendoxException, IOException {

        Project project = projectService.getProjectById(projectId);
        EmbeddingResponse embeddingResponse = getEmbeddingForMessage(message.getValue(),
                project.getProjectAgent().getSemanticSearchModel());
        Embedding messageEmbedding = upsertEmbeddingForText(embeddingResponse, projectId, message.getId(), null);

        List<SectionDistanceDTO> nearestEmbeddings = findNearestEmbeddings(messageEmbedding, projectId, PageRequest.of(0, 5));

        Map<UUID, Double> nearestSectionIds = nearestEmbeddings.stream()
                .collect(Collectors.toMap(SectionDistanceDTO::getSectionsId, SectionDistanceDTO::getDistance));

        List<DocumentInstanceSection> sections = documentSectionService.getSectionsBySectionsIn(projectId, nearestSectionIds.keySet());

        List<DocumentInstanceSectionDTO> instanceSections = new ArrayList<>(sections
                .stream()
                .map(section -> documentInstanceSectionWithDocumentConverter.toDTO(section))
                .peek(sectionDTO -> sectionDTO.setDistanceFromQuestion(nearestSectionIds.get(sectionDTO.getId()))) // Set the distance from the question
                .peek(sectionDTO -> sectionDTO.setDistanceModelName(project.getProjectAgent().getSemanticSearchModel().getName()))
                .toList());

        return instanceSections;
    }

    public List<DocumentInstanceSectionDTO> findProvenAiClosestSections(Message message, UUID projectId) throws GendoxException, IOException {

        ProjectAgent projectAgent = projectAgentService.getAgentByProjectId(projectId);
        if (projectAgent.getAgentVcJwt() == null) {
            throw new GendoxException("PROVENAI_AGENT_NOT_FOUND", "Agent not found in ProvenAI", HttpStatus.NOT_FOUND);
        }

        List<SearchResult> provenAiSearchResults = provenAiService.search(message.getValue(), projectAgent);

        List<DocumentInstanceSectionDTO> provenAiSections = new ArrayList<>();
        for (SearchResult searchResult : provenAiSearchResults) {
            DocumentInstanceSectionDTO sectionDTO = searchResultConverter.toDocumentInstanceDTO(searchResult);
            provenAiSections.add(sectionDTO);
        }

        return provenAiSections;

    }
}



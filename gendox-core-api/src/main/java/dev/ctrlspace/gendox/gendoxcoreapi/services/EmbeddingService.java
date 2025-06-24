package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
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
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CryptographyUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.provenAi.utils.ProvenAiService;
import io.micrometer.observation.annotation.Observed;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.annotation.Nullable;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(EmbeddingService.class);

    private EmbeddingRepository embeddingRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private TypeService typeService;
    private AiModelEmbeddingConverter aiModelEmbeddingConverter;
    private DocumentSectionService documentSectionService;
    private AiModelUtils aiModelUtils;
    private ProjectService projectService;
    private ProvenAiService provenAiService;
    private SearchResultConverter searchResultConverter;
    private DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter;
    private ProjectAgentService projectAgentService;
    private OrganizationModelKeyService organizationModelKeyService;
    private AuditLogsService auditLogsService;
    private CryptographyUtils cryptographyUtils;

    private RerankService rerankService;

    @Value("${proven-ai.enabled}")
    private Boolean provenAiEnabled;

    @Autowired
    public EmbeddingService(
            EmbeddingRepository embeddingRepository,
            AuditLogsRepository auditLogsRepository,
            EmbeddingGroupRepository embeddingGroupRepository,
            TypeService typeService,
            DocumentSectionService documentSectionService,
            AiModelEmbeddingConverter aiModelEmbeddingConverter,
            AiModelUtils aiModelUtils,
            ProjectService projectService,
            ProjectAgentService projectAgentService,
            ProvenAiService provenAiService,
            DocumentInstanceSectionWithDocumentConverter documentInstanceSectionWithDocumentConverter,
            SearchResultConverter searchResultConverter,
            OrganizationModelKeyService organizationModelKeyService,
            AuditLogsService auditLogsService,
            CryptographyUtils cryptographyUtils,
            RerankService rerankService
    ) {
        this.embeddingRepository = embeddingRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.typeService = typeService;
        this.documentSectionService = documentSectionService;
        this.aiModelUtils = aiModelUtils;
        this.projectService = projectService;
        this.aiModelEmbeddingConverter = aiModelEmbeddingConverter;
        this.provenAiService = provenAiService;
        this.documentInstanceSectionWithDocumentConverter = documentInstanceSectionWithDocumentConverter;
        this.searchResultConverter = searchResultConverter;
        this.projectAgentService = projectAgentService;
        this.organizationModelKeyService = organizationModelKeyService;
        this.auditLogsService = auditLogsService;
        this.cryptographyUtils = cryptographyUtils;
        this.rerankService = rerankService;
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

    public Embedding upsertEmbeddingForText(EmbeddingResponse embeddingResponse, UUID projectId, @Nullable UUID messageId, @Nullable UUID sectionId, UUID semanticSearchModelId, UUID organizationId, String sectionSha256Hash) throws GendoxException {

        // TODO investigate merging Embedding and EmbeddingGroup to one table

        Embedding embedding = null;
        Optional<EmbeddingGroup> optionalEmbeddingGroup = embeddingGroupRepository.findBySectionIdOrMessageId(sectionId, messageId);

        if (optionalEmbeddingGroup.isPresent()) {

            EmbeddingGroup embeddingGroup = optionalEmbeddingGroup.get();
            embedding = embeddingRepository.findById(embeddingGroup.getEmbeddingId()).get();

            embedding.setEmbeddingVector(embeddingResponse.getData().get(0).getEmbedding());


            embeddingGroup.setEmbeddingId(embedding.getId());
            embeddingGroup.setTokenCount((double) embeddingResponse.getUsage().getTotalTokens());
            embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
            embeddingGroup.setEmbeddingSha256Hash(sectionSha256Hash);


            embeddingRepository.save(embedding);
            embeddingGroupRepository.save(embeddingGroup);
        } else {
            embedding = aiModelEmbeddingConverter.toEntity(embeddingResponse);
            embedding.setSemanticSearchModelId(semanticSearchModelId);
            embedding.setProjectId(projectId);
            embedding.setOrganizationId(organizationId);
            embedding.setSectionId(sectionId);
            embedding.setMessageId(messageId);

            embedding = createEmbedding(embedding);


            EmbeddingGroup group = createEmbeddingGroup(embedding.getId(), Double.valueOf(embeddingResponse.getUsage().getTotalTokens()), messageId, sectionId, projectId, sectionSha256Hash);

        }

        return embedding;
    }


    public EmbeddingResponse getEmbeddingForMessage(ProjectAgent agent, String value, AiModel aiModel) throws GendoxException {
        return this.getEmbeddingForMessage(agent, Arrays.asList(value), aiModel);
    }


    public EmbeddingResponse getEmbeddingForMessage(ProjectAgent agent, List<String> value, AiModel aiModel) throws GendoxException {
        EmbeddingMessage embeddingMessage = new EmbeddingMessage();
        embeddingMessage.setMessages(value);
        return this.getEmbeddingForMessage(agent, embeddingMessage, aiModel);
    }

    @Observed(name = "EmbeddingService.getEmbeddingForMessage",
            contextualName = "EmbeddingService#getEmbeddingForMessage",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    private EmbeddingResponse getEmbeddingForMessage(ProjectAgent agent, EmbeddingMessage embeddingMessage, AiModel aiModel) throws GendoxException {
        String apiKey = this.getApiKey(agent, "SEMANTIC_SEARCH_MODEL");
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl(aiModel.getAiModelProvider().getApiType().getName());
        EmbeddingResponse embeddingResponse = aiModelApiAdapterService.askEmbedding(embeddingMessage, aiModel, apiKey);

        Type embeddingType = typeService.getAuditLogTypeByName("EMBEDDING_RESPONSE");
        AuditLogs auditLogs = auditLogsService.createDefaultAuditLogs(embeddingType);
        auditLogs.setTokenCount((long) embeddingResponse.getUsage().getTotalTokens());
        auditLogs.setOrganizationId(agent.getProject().getOrganizationId());
        auditLogs.setProjectId(agent.getProject().getId());
        auditLogsService.saveAuditLogs(auditLogs);

        return embeddingResponse;
    }

    public String getApiKey(ProjectAgent agent, String aiModelType) throws GendoxException {
        OrganizationModelProviderKey organizationModelProviderKey = organizationModelKeyService.getKeyForAgent(agent, aiModelType);
        if (organizationModelProviderKey != null) {
            logger.debug("Using OrganizationModelProviderKey ID: {}", organizationModelProviderKey.getId());
            return organizationModelProviderKey.getKey();
        }

        logger.debug("Using default API key for agent id: {} and model type: {}", agent.getId(), aiModelType);
        return organizationModelKeyService.getDefaultKeyForAgent(agent, aiModelType);
    }


    public EmbeddingGroup createEmbeddingGroup(UUID embeddingId, Double tokenCount, UUID message_id, UUID sectionId, UUID projectId, String sectionSha256Hash) throws GendoxException {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(UUID.randomUUID());
        embeddingGroup.setEmbeddingId(embeddingId);
        embeddingGroup.setTokenCount(tokenCount);
        embeddingGroup.setSectionId(sectionId);

        embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
        Project project = projectService.getProjectById(projectId);

        embeddingGroup.setSemanticSearchModelId(project.getProjectAgent().getSemanticSearchModel().getId());
        embeddingGroup.setMessageId(message_id);
        embeddingGroup.setEmbeddingSha256Hash(sectionSha256Hash);


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

    @Transactional
    public void deleteEmbeddingGroupsBySectionIds(List<UUID> sectionIds) throws GendoxException {
        if (sectionIds == null || sectionIds.isEmpty()) {
            return;
        }
        // Retrieve all embedding groups associated with these section IDs
        List<EmbeddingGroup> embeddingGroups = embeddingGroupRepository.findAllBySectionIdIn(sectionIds);
        if (!embeddingGroups.isEmpty()) {
            List<UUID> embeddingIds = embeddingGroups.stream()
                    .map(EmbeddingGroup::getEmbeddingId)
                    .collect(Collectors.toList());

            // delete embedding groups
            embeddingGroupRepository.bulkDeleteBySectionIds(sectionIds);

            // delete embeddings
            embeddingRepository.deleteAllByIdInBatch(embeddingIds);
        }
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
    public List<SectionDistanceDTO> findNearestEmbeddings(Embedding embedding, UUID projectId, Pageable pageRequest) throws GendoxException, IOException {
        List<SectionDistanceDTO> nearestEmbeddings = new ArrayList<>();

        StringBuilder sb = new StringBuilder("[");
        sb.append(embedding.getEmbeddingVector().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        sb.append("]");

        nearestEmbeddings = embeddingRepository.findClosestSectionIdsWithDistance(
                projectId,
                sb.toString(),
                pageRequest.getPageSize(),
                pageRequest.getPageSize() * pageRequest.getPageNumber(),
                embedding.getSemanticSearchModelId());

        return nearestEmbeddings;
    }


    @Observed(name = "EmbeddingService.findClosestSections",
            contextualName = "EmbeddingService#findClosestSections",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<DocumentInstanceSectionDTO> findClosestSections(Message message, Project project, Pageable pageable) throws GendoxException, IOException, NoSuchAlgorithmException {

        UUID projectId = project.getId();


        EmbeddingResponse embeddingResponse = getEmbeddingForMessage(project.getProjectAgent(),
                message.getValue(),
                project.getProjectAgent().getSemanticSearchModel());

        String sectionSha256Hash = cryptographyUtils.calculateSHA256(message.getValue());

        Embedding messageEmbedding = upsertEmbeddingForText(embeddingResponse,
                projectId,
                message.getId(),
                null,
                project.getProjectAgent().getSemanticSearchModel().getId(),
                project.getOrganizationId(),
                sectionSha256Hash);

        List<SectionDistanceDTO> nearestEmbeddings = findNearestEmbeddings(messageEmbedding, projectId, pageable);

        Map<UUID, Double> sectionsDistances = nearestEmbeddings.stream()
                .collect(Collectors.toMap(SectionDistanceDTO::getSectionsId, SectionDistanceDTO::getDistance));

        List<DocumentInstanceSection> allSections = documentSectionService.getSectionsBySectionsIn(projectId, sectionsDistances.keySet());

        List<DocumentInstanceSectionDTO> allSectionsDTO = allSections
                .stream()
                .map(section -> documentInstanceSectionWithDocumentConverter.toDTO(section))
                .peek(sectionDTO -> sectionDTO.setDistanceFromQuestion(sectionsDistances.get(sectionDTO.getId()))) // Set the distance from the question
                .peek(sectionDTO -> sectionDTO.setDistanceModelName(project.getProjectAgent().getSemanticSearchModel().getName()))
                .sorted(Comparator.comparing(DocumentInstanceSectionDTO::getDistanceFromQuestion))
                .collect(Collectors.toList());

        logger.debug("Base sections found: {}", allSections.size());

        // Find more sections from other Projects using ProvenAI if enabled
        if (provenAiEnabled) {
            try {
                logger.info("ProvenAI enabled");
                List<DocumentInstanceSectionDTO> provenAiSections = this.findProvenAiClosestSections(message, project);
                allSectionsDTO.addAll(provenAiSections);
                logger.debug("ProvenAI sections added");
            } catch (GendoxException e) {
                // swallow exception
                if ("PROVENAI_AGENT_NOT_FOUND".equals(e.getErrorCode())) {
                    logger.debug("ProvenAI agent not found");
                } else {
                    throw e;
                }
            }
        }

        logger.debug("Sections after conversion: {}",
                allSectionsDTO.stream()
                        .map(DocumentInstanceSectionDTO::getId)
                        .toList());

        // Rerank the sections
        if (project.getProjectAgent().getRerankEnable() && !allSectionsDTO.isEmpty()) {
            allSectionsDTO = rerankService.rerankSections(project.getProjectAgent(), allSectionsDTO, message.getValue());
            logger.debug("Sections after rerank: {}",
                    allSectionsDTO.stream()
                            .map(DocumentInstanceSectionDTO::getId)
                            .toList());
        }

        return allSectionsDTO;
    }

    public List<DocumentInstanceSectionDTO> findProvenAiClosestSections(Message message, Project project) throws GendoxException, IOException {

        ProjectAgent projectAgent = project.getProjectAgent();
        if (projectAgent.getAgentVcJwt() == null) {
            throw new GendoxException("PROVENAI_AGENT_NOT_FOUND", "Agent not found in ProvenAI", HttpStatus.NOT_FOUND);
        }

        logger.debug("Starting search on provenAI");

        List<SearchResult> provenAiSearchResults = provenAiService.search(message.getValue(), projectAgent);
        List<DocumentInstanceSectionDTO> provenAiSections = new ArrayList<>();
        for (SearchResult searchResult : provenAiSearchResults) {
            DocumentInstanceSectionDTO sectionDTO = searchResultConverter.toDocumentInstanceDTO(searchResult);
            provenAiSections.add(sectionDTO);
        }

        logger.debug("Received provenAI results");

        return provenAiSections;

    }

    public EmbeddingGroup findBySectionOrMessage(UUID sectionId, UUID messageId, UUID semanticSearchModelId) {
        return embeddingGroupRepository.findBySectionIdOrMessageIdAndSemanticSearchModel(sectionId, messageId, semanticSearchModelId).orElse(null);
    }
}



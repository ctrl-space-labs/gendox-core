package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.EmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.AiModelEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.annotation.Nullable;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmbeddingService {

    Logger logger = LoggerFactory.getLogger(EmbeddingService.class);


    private EmbeddingRepository embeddingRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private MessageRepository messageRepository;
    private TypeService typeService;
    private AiModelRepository aiModelRepository;
    private AiModelEmbeddingConverter aiModelEmbeddingConverter;
    private SecurityUtils securityUtils;
    private ProjectAgentService projectAgentService;
    private DocumentSectionService documentSectionService;

    private List<AiModelService> aiModelServices;

    private AiModelUtils aiModelUtils;

    private ProjectService projectService;

    private ProjectAgentRepository projectAgentRepository;

    @Autowired
    private JWTUtils jwtUtils;



    @Autowired
    public EmbeddingService(
                            EmbeddingRepository embeddingRepository,
                            AuditLogsRepository auditLogsRepository,
                            EmbeddingGroupRepository embeddingGroupRepository,
                            MessageRepository messageRepository,
                            TypeService typeService,
                            AiModelRepository aiModelRepository,
                            SecurityUtils securityUtils,
                            ProjectAgentService projectAgentService,
                            DocumentSectionService documentSectionService,
                            AiModelEmbeddingConverter aiModelEmbeddingConverter,
                            AiModelUtils aiModelUtils,
                            List<AiModelService> aiModelServices,
                            ProjectService projectService,
                            ProjectAgentRepository projectAgentRepository) {
        this.aiModelServices = aiModelServices;
        this.embeddingRepository = embeddingRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.messageRepository = messageRepository;
        this.typeService = typeService;
        this.aiModelRepository = aiModelRepository;
        this.securityUtils = securityUtils;
        this.projectAgentService = projectAgentService;
        this.documentSectionService = documentSectionService;
        this.aiModelUtils = aiModelUtils;
        this.projectService = projectService;
        this.aiModelEmbeddingConverter = aiModelEmbeddingConverter;
        this.projectAgentRepository = projectAgentRepository;
    }

    public Embedding createEmbedding(Embedding embedding) throws GendoxException {
        Instant now = Instant.now();


        if (embedding.getId() != null) {
            throw new GendoxException("NEW_EMBEDDING_ID_IS_NOT_NULL", "Embedding id must be null", HttpStatus.BAD_REQUEST);
        }
        embedding.setId(UUID.randomUUID());
        embedding.setCreatedAt(now);
        embedding.setUpdatedAt(now);
        embedding.setCreatedBy(securityUtils.getUserId());
        embedding.setUpdatedBy(securityUtils.getUserId());

        embedding = embeddingRepository.save(embedding);
        return embedding;

    }

    /**
     *
     * It creates or update the embedding and the embedding group
     * Logs to audit logs
     *
     * @param embeddingResponse     the actual embedding
     * @param projectId the project/Agent that is involved
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


            Instant now = Instant.now();
            EmbeddingGroup embeddingGroup = optionalEmbeddingGroup.get();
            embedding = embeddingRepository.findById(embeddingGroup.getEmbeddingId()).get();

            embedding.setEmbeddingVector(embeddingResponse.getData().get(0).getEmbedding());
            embedding.setUpdatedBy(securityUtils.getUserId());
            embedding.setUpdatedAt(now);


            embeddingGroup.setEmbeddingId(embedding.getId());
            embeddingGroup.setTokenCount((double) embeddingResponse.getUsage().getTotalTokens());
            embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());

            Project project = projectService.getProjectById(projectId);
            embeddingGroup.setSemanticSearchModelId(project.getProjectAgent().
                    getSemanticSearchModel().getId());

            embeddingGroup.setUpdatedBy(securityUtils.getUserId());
            embeddingGroup.setUpdatedAt(now);


            embeddingRepository.save(embedding);
            embeddingGroupRepository.save(embeddingGroup);
        } else {
            embedding = aiModelEmbeddingConverter.toEntity(embeddingResponse);
            embedding = createEmbedding(embedding);


            EmbeddingGroup group = createEmbeddingGroup(embedding.getId(), Double.valueOf(embeddingResponse.getUsage().getTotalTokens()), messageId, sectionId, projectId);

        }

        return embedding;
    }


        public EmbeddingResponse getEmbeddingForMessage(String value, String aiModelName) throws GendoxException {

            return this.getEmbeddingForMessage(Arrays.asList(value), aiModelName);
    }

    public EmbeddingResponse getEmbeddingForMessage(List<String> value, String aiModelName) throws GendoxException {
        BotRequest botRequest = new BotRequest();
        botRequest.setMessages(value);
        return this.getEmbeddingForMessage(botRequest, aiModelName);
    }

    public EmbeddingResponse getEmbeddingForMessage(BotRequest botRequest, String aiModel) throws GendoxException {
        AiModelService aiModelService = aiModelUtils.getAiModelServiceImplementation(aiModel);
         aiModelService = aiModelUtils.getAiModelServiceImplementation(aiModel);
        EmbeddingResponse embeddingResponse = aiModelService.askEmbedding(botRequest, aiModel);

        return embeddingResponse;
    }



    public AuditLogs createAuditLogs(UUID projectId, Long tokenCount, Type auditType) {
        AuditLogs auditLog = new AuditLogs();
        auditLog.setUserId(securityUtils.getUserId());
        auditLog.setCreatedAt(Instant.now());
        auditLog.setUpdatedAt(Instant.now());
        auditLog.setCreatedBy(securityUtils.getUserId());
        auditLog.setUpdatedBy(securityUtils.getUserId());
        auditLog.setProjectId(projectId);
        auditLog.setTokenCount(tokenCount);
        auditLog.setType(auditType);

        auditLog = auditLogsRepository.save(auditLog);

        return auditLog;
    }


    public EmbeddingGroup createEmbeddingGroup(UUID embeddingId, Double tokenCount, UUID message_id, UUID sectionId, UUID projectId)  throws GendoxException {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(UUID.randomUUID());
        embeddingGroup.setEmbeddingId(embeddingId);
        embeddingGroup.setTokenCount(tokenCount);
        embeddingGroup.setSectionId(sectionId);

        embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
        Project project = projectService.getProjectById(projectId);

        embeddingGroup.setSemanticSearchModelId(project.getProjectAgent().getSemanticSearchModel().getId());
        embeddingGroup.setMessageId(message_id);

        embeddingGroup.setCreatedAt(Instant.now());
        embeddingGroup.setUpdatedAt(Instant.now());
        embeddingGroup.setCreatedBy(securityUtils.getUserId());
        embeddingGroup.setUpdatedBy(securityUtils.getUserId());

        embeddingGroup = embeddingGroupRepository.save(embeddingGroup);

        return embeddingGroup;
    }

    public Message createMessage(Message message) {

        message.setId(UUID.randomUUID());
        if (message.getThreadId() == null) {
            message.setThreadId(UUID.randomUUID());
        }
        message.setCreatedAt(Instant.now());
        message.setUpdatedAt(Instant.now());

        if (securityUtils.getUserId() == null) {
            ProjectAgent agent = projectAgentService.getAgentByProjectId(message.getProjectId());
            message.setCreatedBy(agent.getUserId());
            message.setUpdatedBy(agent.getUserId());
        } else {
            message.setCreatedBy(securityUtils.getUserId());
            message.setUpdatedBy(securityUtils.getUserId());
        }
        message = messageRepository.save(message);

        return message;
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
    public List<Embedding> findNearestEmbeddings(Embedding embedding, UUID projectId, PageRequest pageRequest) throws GendoxException {
        List<Embedding> nearestEmbeddings = new ArrayList<>();

        StringBuilder sb = new StringBuilder("[");
        sb.append(embedding.getEmbeddingVector().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        sb.append("]");

        nearestEmbeddings = embeddingRepository.findClosestSections(projectId, sb.toString(), pageRequest.getPageSize());
        return nearestEmbeddings;
    }


    public List<DocumentInstanceSection> findClosestSections(Message message, UUID projectId) throws GendoxException {

        Project project = projectService.getProjectById(projectId);
        EmbeddingResponse embeddingResponse = getEmbeddingForMessage(message.getValue(),
                                                        project.getProjectAgent().getSemanticSearchModel().getModel());
        Embedding messageEmbedding = upsertEmbeddingForText(embeddingResponse, projectId, message.getId(), null);

        List<Embedding> nearestEmbeddings = findNearestEmbeddings(messageEmbedding, projectId, PageRequest.of(0, 5));


        Set<UUID> nearestEmbeddingsIds = nearestEmbeddings.stream().map(emb -> emb.getId()).collect(Collectors.toSet());
        List<DocumentInstanceSection> sections = documentSectionService.getSectionsByEmbeddingsIn(projectId, nearestEmbeddingsIds);

        return sections;
    }


}

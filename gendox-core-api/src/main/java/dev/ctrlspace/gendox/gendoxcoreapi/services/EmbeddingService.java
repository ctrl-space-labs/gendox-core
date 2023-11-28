package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.models.auth.In;
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

    private AiModelService aiModelService;
    private EmbeddingRepository embeddingRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private MessageRepository messageRepository;
    private TypeService typeService;
    private AiModelRepository aiModelRepository;
    private OpenAiEmbeddingConverter openAiEmbeddingConverter;
    private SecurityUtils securityUtils;
    private ProjectAgentService projectAgentService;
    private DocumentSectionService documentSectionService;


    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public EmbeddingService(AiModelService aiModelService,
                            EmbeddingRepository embeddingRepository,
                            AuditLogsRepository auditLogsRepository,
                            EmbeddingGroupRepository embeddingGroupRepository,
                            MessageRepository messageRepository,
                            TypeService typeService,
                            OpenAiEmbeddingConverter openAiEmbeddingConverter,
                            AiModelRepository aiModelRepository,
                            SecurityUtils securityUtils,
                            ProjectAgentService projectAgentService,
                            DocumentSectionService documentSectionService) {
        this.aiModelService = aiModelService;
        this.embeddingRepository = embeddingRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.messageRepository = messageRepository;
        this.typeService = typeService;
        this.aiModelRepository = aiModelRepository;
        this.openAiEmbeddingConverter = openAiEmbeddingConverter;
        this.securityUtils = securityUtils;
        this.projectAgentService = projectAgentService;
        this.documentSectionService = documentSectionService;
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
     * @param ada2Response     the actual embedding
     * @param projectId the project/Agent that is involved
     * @return
     * @throws GendoxException
     */

    public Embedding upsertEmbeddingForText(Ada2Response ada2Response, UUID projectId, @Nullable UUID messageId, @Nullable UUID sectionId) throws GendoxException {

        Type embeddingType = typeService.getAuditLogTypeByName("EMBEDDING_REQUEST");
        AuditLogs auditLogs = new AuditLogs();
        auditLogs = createAuditLogs(projectId, (long) ada2Response.getUsage().getTotalTokens(), embeddingType);

        Embedding embedding = null;
        Optional<EmbeddingGroup> optionalEmbeddingGroup = embeddingGroupRepository.findBySectionIdOrMessageId(sectionId, messageId);

        if (optionalEmbeddingGroup.isPresent()) {


            Instant now = Instant.now();
            EmbeddingGroup embeddingGroup = optionalEmbeddingGroup.get();
            embedding = embeddingRepository.findById(embeddingGroup.getEmbeddingId()).get();

            embedding.setEmbeddingVector(ada2Response.getData().get(0).getEmbedding());
            embedding.setUpdatedBy(securityUtils.getUserId());
            embedding.setUpdatedAt(now);


            embeddingGroup.setEmbeddingId(embedding.getId());
            embeddingGroup.setTokenCount((double) ada2Response.getUsage().getTotalTokens());
            embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
            embeddingGroup.setSemanticSearchModelId(aiModelRepository.findByName("Ada2").getId());
            embeddingGroup.setUpdatedBy(securityUtils.getUserId());
            embeddingGroup.setUpdatedAt(now);


            embeddingRepository.save(embedding);
            embeddingGroupRepository.save(embeddingGroup);
        } else {
            embedding = openAiEmbeddingConverter.toEntity(ada2Response);
            embedding = createEmbedding(embedding);


            EmbeddingGroup group = createEmbeddingGroup(embedding.getId(), Double.valueOf(ada2Response.getUsage().getTotalTokens()), messageId, sectionId);

        }

        return embedding;
    }

    public Ada2Response getAda2EmbeddingForMessage(String value) {
        BotRequest botRequest = new BotRequest();
        botRequest.setMessage(value);
        Ada2Response ada2Response = aiModelService.askEmbedding(botRequest);

        return ada2Response;
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


    public EmbeddingGroup createEmbeddingGroup(UUID embeddingId, Double tokenCount, UUID message_id, UUID sectionId) throws GendoxException {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(UUID.randomUUID());
        embeddingGroup.setEmbeddingId(embeddingId);
        embeddingGroup.setTokenCount(tokenCount);
        embeddingGroup.setSectionId(sectionId);
        embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
        embeddingGroup.setSemanticSearchModelId(aiModelRepository.findByName("Ada2").getId());
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
            ProjectAgent agent = projectAgentService.getByProjectId(message.getProjectId());
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
        Ada2Response ada2Response = getAda2EmbeddingForMessage(message.getValue());
        Embedding messageEmbedding = upsertEmbeddingForText(ada2Response, projectId, message.getId(), null);

        List<Embedding> nearestEmbeddings = findNearestEmbeddings(messageEmbedding, projectId, PageRequest.of(0, 5));


        Set<UUID> nearestEmbeddingsIds = nearestEmbeddings.stream().map(emb -> emb.getId()).collect(Collectors.toSet());
        List<DocumentInstanceSection> sections = documentSectionService.getSectionsByEmbeddingsIn(projectId, nearestEmbeddingsIds);

        return sections;
    }


}

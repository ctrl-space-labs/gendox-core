package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

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
    private DocumentService documentService;
    private MessageRepository messageRepository;
    private TypeService typeService;
    private AiModelRepository aiModelRepository;
    private UserRepository userRepository;
    private OpenAiEmbeddingConverter openAiEmbeddingConverter;



    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public EmbeddingService(AiModelService aiModelService,
                            EmbeddingRepository embeddingRepository,
                            AuditLogsRepository auditLogsRepository,
                            EmbeddingGroupRepository embeddingGroupRepository,
                            DocumentService documentService,
                            MessageRepository messageRepository,
                            TypeService typeService,
                            OpenAiEmbeddingConverter openAiEmbeddingConverter,
                            AiModelRepository aiModelRepository,
                            UserRepository userRepository) {
        this.aiModelService = aiModelService;
        this.embeddingRepository = embeddingRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.documentService = documentService;
        this.messageRepository = messageRepository;
        this.typeService = typeService;
        this.aiModelRepository = aiModelRepository;
        this.userRepository = userRepository;
        this.openAiEmbeddingConverter = openAiEmbeddingConverter;
    }

    public Embedding createEmbedding(Embedding embedding) throws GendoxException {
        Instant now = Instant.now();


        if (embedding.getId() != null) {
            throw new GendoxException("NEW_EMBEDDING_ID_IS_NOT_NULL", "Embedding id must be null", HttpStatus.BAD_REQUEST);
        }
        embedding.setId(UUID.randomUUID());
        embedding.setCreatedAt(now);
        embedding.setUpdatedAt(now);
        embedding.setCreatedBy(getUserId());
        embedding.setUpdatedBy(getUserId());

        embedding = embeddingRepository.save(embedding);
        return embedding;

    }

    /**
     * Calculates the embedding for a message
     * It created and stores the embedding and the embedding group
     * Logs to audit logs
     *
     * @param value     the text on which the embedding will be calculated
     * @param projectId the project/Agent that is involved
     * @return
     * @throws GendoxException
     */

    public Embedding calculateEmbeddingForText(String value, UUID projectId) throws GendoxException {
        Ada2Response ada2Response = getAda2EmbeddingForMessage(value);
        Embedding embedding = openAiEmbeddingConverter.toEntity(ada2Response);
        embedding = createEmbedding(embedding);

        AuditLogs auditLogs = new AuditLogs();
        auditLogs = createAuditLogs(projectId, (long) ada2Response.getUsage().getTotalTokens());

        EmbeddingGroup group = createEmbeddingGroup(embedding.getId(), Double.valueOf(ada2Response.getUsage().getTotalTokens()));

        return embedding;
    }

    private Ada2Response getAda2EmbeddingForMessage(String value) {
        BotRequest botRequest = new BotRequest();
        botRequest.setMessage(value);
        Ada2Response ada2Response = aiModelService.askEmbedding(botRequest);

        return ada2Response;
    }

    public AuditLogs createAuditLogs(UUID projectId, Long tokenCount) {
        AuditLogs auditLog = new AuditLogs();
        auditLog.setUserId(getUserId());
        auditLog.setCreatedAt(Instant.now());
        auditLog.setUpdatedAt(Instant.now());
        auditLog.setCreatedBy(getUserId());
        auditLog.setUpdatedBy(getUserId());
        auditLog.setProjectId(projectId);
        auditLog.setTokenCount(tokenCount);

        auditLog = auditLogsRepository.save(auditLog);

        return auditLog;
    }


    public EmbeddingGroup createEmbeddingGroup(UUID embeddingId, Double tokenCount) throws GendoxException {
        EmbeddingGroup embeddingGroup = new EmbeddingGroup();

        embeddingGroup.setId(UUID.randomUUID());
        embeddingGroup.setEmbeddingId(embeddingId);
        embeddingGroup.setTokenCount(tokenCount);
        embeddingGroup.setGroupingStrategyType(typeService.getGroupingTypeByName("SIMPLE_SECTION").getId());
        embeddingGroup.setSemanticSearchModelId(aiModelRepository.findByName("Ada2").getId());

        embeddingGroup.setCreatedAt(Instant.now());
        embeddingGroup.setUpdatedAt(Instant.now());
        embeddingGroup.setCreatedBy(getUserId());
        embeddingGroup.setUpdatedBy(getUserId());

        embeddingGroup = embeddingGroupRepository.save(embeddingGroup);

        return embeddingGroup;
    }

    public Message createMessage(Message message) {

        message.setId(UUID.randomUUID());
        message.setCreatedAt(Instant.now());
        message.setUpdatedAt(Instant.now());
        message.setCreatedBy(getUserId());
        message.setUpdatedBy(getUserId());

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
        Embedding messageEmbedding = calculateEmbeddingForText(message.getValue(), projectId);

        List<Embedding> nearestEmbeddings = findNearestEmbeddings(messageEmbedding, projectId, PageRequest.of(0, 5));


        Set<UUID> nearestEmbeddingsIds = nearestEmbeddings.stream().map(emb -> emb.getId()).collect(Collectors.toSet());
        List<DocumentInstanceSection> sections = documentService.getSectionsByEmbeddingsIn(projectId, nearestEmbeddingsIds);

        return sections;
    }


    public UUID getUserId() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<User> user = userRepository.findByName("Discord");
            return user.get().getId();
        } else {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());
            return UUID.fromString(jwtDTO.getUserId());
        }
    }


}

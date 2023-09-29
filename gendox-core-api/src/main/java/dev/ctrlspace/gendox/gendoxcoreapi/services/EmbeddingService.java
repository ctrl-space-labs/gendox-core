package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelServiceImpl;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EmbeddingGroupConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmbeddingService {

    Logger logger = LoggerFactory.getLogger(AiModelServiceImpl.class);

    private AiModelService aiModelService;
    private EmbeddingRepository embeddingRepository;
    private DocumentInstanceSectionRepository sectionRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private EmbeddingGroupConverter embeddingGroupConverter;
    private ProjectDocumentRepository projectDocumentRepository;
    private DocumentInstanceSectionRepository documentInstanceSectionRepository;
    //  private JdbcTemplate jdbcTemplate;
    private MessageConverter messageConverter;
    private MessageRepository messageRepository;
    private TypeService typeService;
    private AiModelRepository aiModelRepository;
    private UserRepository userRepository;


    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public EmbeddingService(AiModelService aiModelService,
                            EmbeddingRepository embeddingRepository,
                            DocumentInstanceSectionRepository sectionRepository,
                            AuditLogsRepository auditLogsRepository,
                            EmbeddingGroupRepository embeddingGroupRepository,
                            EmbeddingGroupConverter embeddingGroupConverter,
                            ProjectDocumentRepository projectDocumentRepository,
                            DocumentInstanceSectionRepository documentInstanceSectionRepository/*,
                            JdbcTemplate jdbcTemplate*/,
                            MessageConverter messageConverter,
                            MessageRepository messageRepository,
                            TypeService typeService,
                            AiModelRepository aiModelRepository,
                            UserRepository userRepository) {
        this.aiModelService = aiModelService;
        this.embeddingRepository = embeddingRepository;
        this.sectionRepository = sectionRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.embeddingGroupConverter = embeddingGroupConverter;
        this.projectDocumentRepository = projectDocumentRepository;
        this.documentInstanceSectionRepository = documentInstanceSectionRepository;
//        this.jdbcTemplate = jdbcTemplate;
        this.messageConverter = messageConverter;
        this.messageRepository = messageRepository;
        this.typeService = typeService;
        this.aiModelRepository = aiModelRepository;
        this.userRepository = userRepository;
    }

    public Embedding calculateEmbeddingForText(String value, UUID projectId) throws GendoxException {
        BotRequest botRequest = new BotRequest();
        botRequest.setMessage(value);
        Ada2Response ada2Response = aiModelService.askEmbedding(botRequest);
        Embedding embedding = new Embedding();

        embedding.setEmbeddingVector(ada2Response.getData().get(0).getEmbedding());
        embedding.setId(UUID.randomUUID());
        embedding.setCreatedAt(Instant.now());
        embedding.setUpdatedAt(Instant.now());
        embedding.setCreatedBy(getUserId());
        embedding.setUpdatedBy(getUserId());

        embedding = embeddingRepository.save(embedding);

        AuditLogs auditLogs = new AuditLogs();
        auditLogs = createAuditLogs(projectId, (long) ada2Response.getUsage().getTotalTokens());

        EmbeddingGroup group = new EmbeddingGroup();
        group = createEmbeddingGroup(embedding.getId(), Double.valueOf(ada2Response.getUsage().getTotalTokens()));

        return embedding;
    }


    public Embedding runTrainingForSection(UUID sectionId, UUID projectId) throws GendoxException {

        // Use Optional to handle the result of findById
        Optional<DocumentInstanceSection> optionalSection = sectionRepository.findById(sectionId);

        if (optionalSection.isPresent()) {
            DocumentInstanceSection section = optionalSection.get();

            Embedding embedding = new Embedding();
            embedding = calculateEmbeddingForText(section.getSectionValue(), projectId);

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

    public Message createMessage(Message message) throws GendoxException {

        message.setId(UUID.randomUUID());
        message.setCreatedAt(Instant.now());
        message.setUpdatedAt(Instant.now());
        message.setCreatedBy(getUserId());
        message.setUpdatedBy(getUserId());

        message = messageRepository.save(message);

        return message;
    }

    public List<DocumentInstanceSection> findClosestSections(Message message, UUID projectId) throws GendoxException {
        Embedding messageEmbedding = calculateEmbeddingForText(message.getValue(), projectId);
        List<Embedding> nearestEmbeddings = new ArrayList<>();

        StringBuilder sb = new StringBuilder("[");
        sb.append(messageEmbedding.getEmbeddingVector().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")));
        sb.append("]");


        nearestEmbeddings = embeddingRepository.findClosestSections(projectId, sb.toString());
        Set<UUID> nearestEmbeddingsIds = nearestEmbeddings.stream().map(emb -> emb.getId()).collect(Collectors.toSet());
        List<DocumentInstanceSection> sections = new ArrayList<>();
        sections = documentInstanceSectionRepository.findByEmbeddingIds(nearestEmbeddingsIds);
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

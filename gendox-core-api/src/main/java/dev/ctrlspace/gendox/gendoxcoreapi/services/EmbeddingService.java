package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.BotRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Ada2Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelServiceImpl;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.EmbeddingGroupConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageGpt35MessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.OpenAiEmbeddingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.chat.templates.ChatTemplate;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.section.templates.SectionTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    Logger logger = LoggerFactory.getLogger(AiModelServiceImpl.class);

    @Value("${gendox.agents.chat-template}")
    private String chatTemplateName;

    @Value("${gendox.agents.section-template}")
    private String sectionTemplateName;


    private AiModelService aiModelService;
    private ProjectService projectService;
    private EmbeddingRepository embeddingRepository;
    private DocumentInstanceSectionRepository sectionRepository;
    private AuditLogsRepository auditLogsRepository;
    private EmbeddingGroupRepository embeddingGroupRepository;
    private MessageGpt35MessageConverter messageGpt35MessageConverter;
    private EmbeddingGroupConverter embeddingGroupConverter;
    private ProjectDocumentRepository projectDocumentRepository;
    private DocumentService documentService;
    //  private JdbcTemplate jdbcTemplate;
    private MessageConverter messageConverter;
    private MessageRepository messageRepository;
    private TypeService typeService;
    private AiModelRepository aiModelRepository;
    private UserRepository userRepository;
    private OpenAiEmbeddingConverter openAiEmbeddingConverter;
    private ServiceSelector serviceSelector;


    @Autowired
    private JWTUtils jwtUtils;

    @Autowired
    public EmbeddingService(AiModelService aiModelService,
                            ProjectService projectService,
                            EmbeddingRepository embeddingRepository,
                            MessageGpt35MessageConverter messageGpt35MessageConverter,
                            DocumentInstanceSectionRepository sectionRepository,
                            AuditLogsRepository auditLogsRepository,
                            EmbeddingGroupRepository embeddingGroupRepository,
                            EmbeddingGroupConverter embeddingGroupConverter,
                            ProjectDocumentRepository projectDocumentRepository,
                            DocumentService documentService/*,
                            JdbcTemplate jdbcTemplate*/,
                            MessageConverter messageConverter,
                            MessageRepository messageRepository,
                            TypeService typeService,
                            OpenAiEmbeddingConverter openAiEmbeddingConverter,
                            AiModelRepository aiModelRepository,
                            UserRepository userRepository,
                            ServiceSelector serviceSelector) {
        this.aiModelService = aiModelService;
        this.embeddingRepository = embeddingRepository;
        this.projectService = projectService;
        this.sectionRepository = sectionRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.embeddingGroupRepository = embeddingGroupRepository;
        this.embeddingGroupConverter = embeddingGroupConverter;
        this.projectDocumentRepository = projectDocumentRepository;
        this.documentService = documentService;
//        this.jdbcTemplate = jdbcTemplate;
        this.messageConverter = messageConverter;
        this.messageGpt35MessageConverter = messageGpt35MessageConverter;
        this.messageRepository = messageRepository;
        this.typeService = typeService;
        this.aiModelRepository = aiModelRepository;
        this.userRepository = userRepository;
        this.openAiEmbeddingConverter = openAiEmbeddingConverter;
        this.serviceSelector = serviceSelector;
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

    private Gpt35Response getCompletionForMessages(List<Message> messages, String agentRole) throws GendoxException {

        //TODO add in DB table message, a field for the role of the message
        // if the message is from a user it will have role: "user" (or the role: ${userName})
        // if the message is from the agent it will have the role: ${agentName}
        // for the time being only 1 message will be in the list, from the user

        List<Gpt35Message> gpt35Messages = new ArrayList<>();
        for (Message message : messages) {
            Gpt35Message gpt35Message = messageGpt35MessageConverter.toDTO(message);
            gpt35Messages.add(gpt35Message);
        }

        Gpt35Response ada2Response = aiModelService.askCompletion(gpt35Messages, agentRole);

        return ada2Response;
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

    public Message getCompletion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {
        String question = convertToGPTTextQuestion(message, nearestSections, projectId);
        Project project = projectService.getProjectById(projectId);

        // clone message to avoid changing the original message text in DB
        Message promptMessage = message.toBuilder().value(question).build();


        Gpt35Response gpt35Response = getCompletionForMessages(List.of(promptMessage), project.getProjectAgent().getAgentBehavior());

        // TODO add AuditLogs (audit log need to be expanded including prompt_tokens and completion_tokens)
        AuditLogs auditLogs = createAuditLogs(projectId, (long) gpt35Response.getUsage().getTotalTokens());
        Message completionResponseMessage = messageGpt35MessageConverter.toEntity(gpt35Response.getChoices().get(0).getMessage());
        // TODO save the above response message

        return completionResponseMessage;

    }

    public String convertToGPTTextQuestion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {

        // TODO investigate if we want to split the context and question
        //  to 2 different messages with role: "contextProvider" and role: "user"

        // run sectionTemplate
        SectionTemplate sectionTemplate = serviceSelector.getSectionTemplateByName(sectionTemplateName);
        if (sectionTemplate == null) {
            // If sectionTemplate is not found, throw a GendoxException
            throw new GendoxException("SECTION_TEMPLATE_NOT_FOUND", "Section template not found with name: " + sectionTemplateName, HttpStatus.NOT_FOUND);
        }
        String sectionValues = sectionTemplate.sectionValues(nearestSections, projectId);

        // run chatTemplate
        ChatTemplate chatTemplate = serviceSelector.getChatTemplateByName(chatTemplateName);
        if (chatTemplate == null) {
            // If chatTemplate is not found, throw a GendoxException
            throw new GendoxException("Chat_TEMPLATE_NOT_FOUND", "chat template not found with name: " + chatTemplateName, HttpStatus.NOT_FOUND);
        }

        String answer = chatTemplate.chatTemplate(message, sectionValues);
        return answer;


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

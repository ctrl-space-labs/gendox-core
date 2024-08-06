package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelTypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

import org.slf4j.Logger;

@Service
public class CompletionService {



    Logger logger = LoggerFactory.getLogger(CompletionService.class);
    private ProjectService projectService;
    private MessageAiMessageConverter messageAiMessageConverter;
    private EmbeddingService embeddingService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private TypeService typeService;
    private List<AiModelTypeService> aiModelTypeServices;
    private TrainingService trainingService;
    private ProjectAgentService projectAgentService;
    private MessageService messageService;

    private AiModelUtils aiModelUtils;
    @Autowired
    public CompletionService(ProjectService projectService,
                             MessageAiMessageConverter messageAiMessageConverter,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TypeService typeService,
                             List<AiModelTypeService> aiModelTypeServices,
                             DocumentInstanceSectionRepository documentInstanceSectionRepository,
                             AiModelUtils aiModelUtils,
                             ProjectAgentService projectAgentService,
                             TrainingService trainingService,
                             MessageService messageService) {
        this.projectService = projectService;
        this.messageAiMessageConverter = messageAiMessageConverter;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
        this.aiModelUtils = aiModelUtils;
        this.projectAgentService = projectAgentService;
        this.messageService = messageService;
    }

    private CompletionResponse getCompletionForMessages(List<AiModelMessage> aiModelMessages, String agentRole, AiModel aiModel,
                                                 AiModelRequestParams aiModelRequestParams) throws GendoxException {

        //choose the correct aiModel adapter
        AiModelTypeService aiModelTypeService = aiModelUtils.getAiModelServiceImplementation(aiModel);
        CompletionResponse completionResponse = aiModelTypeService.askCompletion(aiModelMessages, agentRole, aiModel.getModel(), aiModelRequestParams);
        return completionResponse;
    }


    public Message getCompletion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {
        String question = convertToAiModelTextQuestion(message, nearestSections, projectId);
        // check moderation
        OpenAiGpt35ModerationResponse openAiGpt35ModerationResponse = trainingService.getModeration(question);
        if (openAiGpt35ModerationResponse.getResults().get(0).isFlagged()) {
            throw new GendoxException("MODERATION_CHECK_FAILED", "The question did not pass moderation.", HttpStatus.NOT_ACCEPTABLE);
        }


        Project project = projectService.getProjectById(projectId);
        ProjectAgent agent = project.getProjectAgent();
        List<AiModelMessage> previousMessages = messageService.getPreviousMessages(message, 4);

        // clone message to avoid changing the original message text in DB
        AiModelMessage promptMessage = AiModelMessage.builder()
                .content(question)
                .role("user")
                .build();

        previousMessages.add(promptMessage);

         AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(project.getProjectAgent().getMaxToken())
                .temperature(project.getProjectAgent().getTemperature())
                .topP(project.getProjectAgent().getTopP())
                .build();

        CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                project.getProjectAgent().getAgentBehavior(),
                project.getProjectAgent().getCompletionModel(),
                aiModelRequestParams);

        Type completionType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        // TODO add AuditLogs (audit log need to be expanded including prompt_tokens and completion_tokens)
        AuditLogs auditLogs = embeddingService.createAuditLogs(projectId, (long) completionResponse.getUsage().getTotalTokens(), completionType);
        Message completionResponseMessage = messageAiMessageConverter.toEntity(completionResponse.getChoices().get(0).getMessage());

        completionResponseMessage.setProjectId(projectId);
        completionResponseMessage.setThreadId(message.getThreadId());
        completionResponseMessage.setCreatedBy(agent.getUserId());
        completionResponseMessage.setUpdatedBy(agent.getUserId());
        completionResponseMessage = messageService.createMessage(completionResponseMessage);

        return completionResponseMessage;

    }


    public String convertToAiModelTextQuestion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {

        // TODO investigate if we want to split the context and question
        //  to 2 different messages with role: "contextProvider" and role: "user"

        // take the types name
        ProjectAgent agent = projectAgentRepository.findByProjectId(projectId);
        Template agentSectionTemplate = templateRepository.findByIdIs(agent.getSectionTemplateId());
        Template agentChatTemplate = templateRepository.findByIdIs(agent.getChatTemplateId());

        // run sectionTemplate
        SectionTemplateAuthor sectionTemplateAuthor = new SectionTemplateAuthor();

        String sectionValues = sectionTemplateAuthor.sectionValues(nearestSections, agentSectionTemplate.getText());

        // run chatTemplate
        ChatTemplateAuthor chatTemplateAuthor = new ChatTemplateAuthor();

        String answer = chatTemplateAuthor.chatTemplate(message, sectionValues, agentChatTemplate.getText());


        return answer;


    }


}

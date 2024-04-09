package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiGpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelService;
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
    private List<AiModelService> aiModelServices;
    private TrainingService trainingService;
    private ProjectAgentService projectAgentService;

    private AiModelUtils aiModelUtils;
    @Autowired
    public CompletionService(ProjectService projectService,
                             MessageAiMessageConverter messageAiMessageConverter,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TypeService typeService,
                             List<AiModelService> aiModelServices,
                             DocumentInstanceSectionRepository documentInstanceSectionRepository,
                             AiModelUtils aiModelUtils,
                             ProjectAgentService projectAgentService,
                             TrainingService trainingService) {
        this.projectService = projectService;
        this.messageAiMessageConverter = messageAiMessageConverter;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
        this.aiModelUtils = aiModelUtils;
        this.projectAgentService = projectAgentService;

    }

    private CompletionResponse getCompletionForMessages(List<Message> messages, String agentRole, String aiModel,
                                                 AiModelRequestParams aiModelRequestParams) throws GendoxException {

        //TODO add in DB table message, a field for the role of the message
        // if the message is from a user it will have role: "user" (or the role: ${userName})
        // if the message is from the agent it will have the role: ${agentName}
        // for the time being only 1 message will be in the list, from the user

        List<AiModelMessage> aiModelMessages = new ArrayList<>();
        for (Message message : messages) {
            AiModelMessage aiModelMessage = messageAiMessageConverter.toDTO(message);
            aiModelMessages.add(aiModelMessage);
        }
        //choose the correct aiModel adapter
        AiModelService aiModelService = aiModelUtils.getAiModelServiceImplementation(aiModel);
        CompletionResponse completionResponse = aiModelService.askCompletion(aiModelMessages, agentRole, aiModel, aiModelRequestParams);
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

        // clone message to avoid changing the original message text in DB
        Message promptMessage = message.toBuilder().value(question).build();

         AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(project.getProjectAgent().getMaxToken())
                .temperature(project.getProjectAgent().getTemperature())
                .topP(project.getProjectAgent().getTopP())
                .build();

        CompletionResponse completionResponse = getCompletionForMessages(List.of(promptMessage),
                project.getProjectAgent().getAgentBehavior(),
                project.getProjectAgent().getCompletionModel().getModel(),
                aiModelRequestParams);

        Type completionType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        // TODO add AuditLogs (audit log need to be expanded including prompt_tokens and completion_tokens)
        AuditLogs auditLogs = embeddingService.createAuditLogs(projectId, (long) completionResponse.getUsage().getTotalTokens(), completionType);
        Message completionResponseMessage = messageAiMessageConverter.toEntity(completionResponse.getChoices().get(0).getMessage());

        // TODO save the above response message
        ProjectAgent agent = projectAgentService.getAgentByProjectId(projectId);
        completionResponseMessage.setProjectId(projectId);
        completionResponseMessage.setThreadId(message.getThreadId());
        completionResponseMessage.setCreatedBy(agent.getUserId());
        completionResponseMessage.setUpdatedBy(agent.getUserId());
        completionResponseMessage = embeddingService.createMessage(completionResponseMessage);

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

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.Gpt35Message;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35Response;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageGpt35MessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

import org.slf4j.Logger;

@Service
public class CompletionService {



    Logger logger = LoggerFactory.getLogger(CompletionService.class);
    private ProjectService projectService;
    private MessageGpt35MessageConverter messageGpt35MessageConverter;
    private AiModelService aiModelService;
    private EmbeddingService embeddingService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private TrainingService trainingService;


    @Autowired
    public CompletionService(ProjectService projectService,
                             MessageGpt35MessageConverter messageGpt35MessageConverter,
                             AiModelService aiModelService,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TrainingService trainingService) {
        this.projectService = projectService;
        this.messageGpt35MessageConverter = messageGpt35MessageConverter;
        this.aiModelService = aiModelService;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
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


    public Message getCompletion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {
        String question = convertToGPTTextQuestion(message, nearestSections, projectId);
        // check moderation
        Gpt35ModerationResponse moderationResponse = trainingService.getModeration(question);
        if (moderationResponse.getResults().get(0).isFlagged()) {
            throw new GendoxException("MODERATION_CHECK_FAILED", "The question did not pass moderation.", HttpStatus.NOT_ACCEPTABLE);
        }


        Project project = projectService.getProjectById(projectId);

        // clone message to avoid changing the original message text in DB
        Message promptMessage = message.toBuilder().value(question).build();


        Gpt35Response gpt35Response = getCompletionForMessages(List.of(promptMessage), project.getProjectAgent().getAgentBehavior());

        // TODO add AuditLogs (audit log need to be expanded including prompt_tokens and completion_tokens)
        AuditLogs auditLogs = embeddingService.createAuditLogs(projectId, (long) gpt35Response.getUsage().getTotalTokens());
        Message completionResponseMessage = messageGpt35MessageConverter.toEntity(gpt35Response.getChoices().get(0).getMessage());
        // TODO save the above response message

        return completionResponseMessage;

    }


    public String convertToGPTTextQuestion(Message message, List<DocumentInstanceSection> nearestSections, UUID projectId) throws GendoxException {

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

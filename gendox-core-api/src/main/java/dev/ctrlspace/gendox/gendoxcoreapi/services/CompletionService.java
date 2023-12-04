package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.GptMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Gpt35ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.GptResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.GptRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageGptMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
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
//    private MessageGpt35MessageConverter messageGpt35MessageConverter;
    private MessageGptMessageConverter messageGptMessageConverter;

    private AiModelService aiModelService;
    private EmbeddingService embeddingService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private TypeService typeService;
    private TrainingService trainingService;

    @Autowired
    public CompletionService(ProjectService projectService,
                             MessageGptMessageConverter messageGptMessageConverter,
                             AiModelService aiModelService,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TypeService typeService,
                             DocumentInstanceSectionRepository documentInstanceSectionRepository,
                             TrainingService trainingService) {
        this.projectService = projectService;
        this.messageGptMessageConverter = messageGptMessageConverter;
        this.aiModelService = aiModelService;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
    }

    private GptResponse getCompletionForMessages(List<Message> messages, String agentRole, String aiModelName,
                                                 GptRequestParams gptRequestParams) throws GendoxException {

        //TODO add in DB table message, a field for the role of the message
        // if the message is from a user it will have role: "user" (or the role: ${userName})
        // if the message is from the agent it will have the role: ${agentName}
        // for the time being only 1 message will be in the list, from the user

        List<GptMessage> gptMessages = new ArrayList<>();
        for (Message message : messages) {
            GptMessage gptMessage = messageGptMessageConverter.toDTO(message);
            gptMessages.add(gptMessage);
        }
        GptResponse ada2Response = aiModelService.askCompletionGpt(gptMessages, agentRole, aiModelName, gptRequestParams);

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

         GptRequestParams gptRequestParams = GptRequestParams.builder()
                .maxTokens(project.getProjectAgent().getMaxToken())
                .temperature(project.getProjectAgent().getTemperature())
                .topP(project.getProjectAgent().getTopP())
                .build();

        GptResponse gptResponse = getCompletionForMessages(List.of(promptMessage), project.getProjectAgent().
                                                               getAgentBehavior(),project.getProjectAgent().
                                                               getCompletionModel().getModel(), gptRequestParams);

        Type completionType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        // TODO add AuditLogs (audit log need to be expanded including prompt_tokens and completion_tokens)
        AuditLogs auditLogs = embeddingService.createAuditLogs(projectId, (long) gptResponse.getUsage().getTotalTokens(), completionType);
        Message completionResponseMessage = messageGptMessageConverter.toEntity(gptResponse.getChoices().get(0).getMessage());
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

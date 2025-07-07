package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProvenAiMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.SectionTemplateAuthor;
import io.micrometer.observation.annotation.Observed;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;

@Service
public class CompletionService {


    Logger logger = LoggerFactory.getLogger(CompletionService.class);


    // "self" here will be the OAP proxy, to avoid self-invocation problem
    private CompletionService self;

    private ProjectService projectService;
    private MessageAiMessageConverter messageAiMessageConverter;
    private EmbeddingService embeddingService;
    private ProjectAgentRepository projectAgentRepository;
    private TemplateRepository templateRepository;
    private TypeService typeService;
    private TrainingService trainingService;
    private MessageService messageService;
    private OrganizationModelKeyService organizationModelKeyService;
    private AuditLogsService auditLogsService;
    private DocumentUtils documentUtils;


    private AiModelUtils aiModelUtils;

    private ObjectMapper objectMapper;

    @Autowired
    public CompletionService(@Lazy CompletionService self,
                             ProjectService projectService,
                             MessageAiMessageConverter messageAiMessageConverter,
                             EmbeddingService embeddingService,
                             ProjectAgentRepository projectAgentRepository,
                             TemplateRepository templateRepository,
                             TypeService typeService,
                             AiModelUtils aiModelUtils,
                             ProjectAgentService projectAgentService,
                             TrainingService trainingService,
                             OrganizationModelKeyService organizationModelKeyService,
                             MessageService messageService,
                             AuditLogsService auditLogsService,
                             DocumentUtils documentUtils,
                             ObjectMapper objectMapper) {
        this.self = self;
        this.projectService = projectService;
        this.messageAiMessageConverter = messageAiMessageConverter;
        this.embeddingService = embeddingService;
        this.projectAgentRepository = projectAgentRepository;
        this.templateRepository = templateRepository;
        this.trainingService = trainingService;
        this.typeService = typeService;
        this.aiModelUtils = aiModelUtils;
        this.organizationModelKeyService = organizationModelKeyService;
        this.messageService = messageService;
        this.auditLogsService = auditLogsService;
        this.documentUtils = documentUtils;
        this.objectMapper = objectMapper;
    }

    private CompletionResponse getCompletionForMessages(List<AiModelMessage> aiModelMessages, String agentRole, AiModel aiModel,
                                                        AiModelRequestParams aiModelRequestParams, String apiKey, List<AiTools> tools, String toolChoice) throws GendoxException {

        //choose the correct aiModel adapter
        AiModelApiAdapterService aiModelApiAdapterService = aiModelUtils.getAiModelApiAdapterImpl(aiModel.getAiModelProvider().getApiType().getName());
        CompletionResponse completionResponse = aiModelApiAdapterService.askCompletion(aiModelMessages, agentRole, aiModel, aiModelRequestParams, apiKey, tools, toolChoice);
        return completionResponse;
    }


    /**
     * This method is used to get the completion for the given message and project.
     * It will search for the closest sections and return the completion response.
     * This is mainly used by the /chat API where the user asks a question and the agent searching in the knowledge base before answering.
     *
     * @param message
     * @param project
     * @return CompletionMessageDTO
     * @throws GendoxException
     * @throws IOException
     * @throws NoSuchAlgorithmException
     */
    @Observed(name = "CompletionService.getCompletionSearch",
            contextualName = "CompletionService#getCompletionSearch",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public CompletionMessageDTO getCompletionSearch(Message message, Project project) throws GendoxException, IOException, NoSuchAlgorithmException {

        List<DocumentInstanceSectionDTO> topSectionsForCompletion = new ArrayList<>();
        List<DocumentInstanceSectionDTO> searchHistorySections = new ArrayList<>();

        // search and rerank sections
        List<DocumentInstanceSectionDTO> sectionDTOs = embeddingService.findClosestSections(
                message,
                project,
                PageRequest.of(0, project.getProjectAgent().getMaxSearchLimit().intValue())
        );



        int maxCompletionLimit = project.getProjectAgent().getMaxCompletionLimit().intValue();

        // Choose the sections that will be included in the completion response
        for (int i = 0; i < sectionDTOs.size(); i++) {
            DocumentInstanceSectionDTO section = sectionDTOs.get(i);
            if (i < maxCompletionLimit) {
                topSectionsForCompletion.add(section);
            } else {
                searchHistorySections.add(section);
            }
        }

        // Get the actual completion
        List<Message> completions = self.getCompletion(message, topSectionsForCompletion, project);

        // Associate the sections with the completion messages
        List<MessageSection> topCompletionMessageSections;
        List<MessageSection> searchHistoryMessageSections;
        for (Message m : completions) {
            if (m.getRole().equals("assistant")) {
                //each agent message connected with the sections
                topCompletionMessageSections = messageService.createMessageSections(topSectionsForCompletion, m, true);
                searchHistoryMessageSections = messageService.createMessageSections(searchHistorySections, m, false);
                messageService.updateMessageWithSections(m, topCompletionMessageSections);
            }
        }

        // Prepare the completion metadata
        List<ProvenAiMetadata> sectionInfos = sectionDTOs.stream()
                .map(section -> ProvenAiMetadata.builder()
                        .sectionId(section.getId()) // Section ID
                        .iscc(section.getDocumentSectionIsccCode())
                        .title(section.getDocumentSectionMetadata().getTitle())
                        .documentURL(section.getDocumentURL())
                        .tokens(section.getTokenCount())
                        .ownerName(section.getOwnerName())
                        .signedPermissionOfUseVc(section.getSignedPermissionOfUseVc())
                        .aiModelName(section.getAiModelName())
                        .build())
                .collect(Collectors.toList());

        return CompletionMessageDTO.builder()
                .messages(completions)
                .threadId(message.getThreadId())
                .provenAiMetadata(sectionInfos) // Populate with detailed section info
                .build();


    }


    /**
     * This method is used to get the completion for the given message and project.
     * The completion context need to be given either in the message or in the nearestSections.
     * Currently, if the agent wants to execute a tool, it will be marked as "done" and provided to the LLM for a final response.
     *
     * @param message the user message that contains the question
     * @param nearestSections the nearest sections that will be used to provide context for the completion.
     * @param project the project that contains the agent and its settings.
     * @return the list of responses. Might be more than one if there are tool calls in the completion response.
     * @throws GendoxException
     */
        @Observed(name = "CompletionService.getCompletion",
            contextualName = "CompletionService#getCompletion",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public List<Message> getCompletion(Message message, List<DocumentInstanceSectionDTO> nearestSections, Project project) throws GendoxException {
        String question = convertToAiModelTextQuestion(message, nearestSections, project.getId());

        ProjectAgent agent = project.getProjectAgent();
        List<AiTools> availableTools = agent.getAiTools();

        // check moderation
        String moderationApiKey = organizationModelKeyService.getDefaultKeyForAgent(agent, "MODERATION_MODEL");
        ModerationResponse moderationResponse = trainingService.getModeration(question, moderationApiKey, agent.getModerationModel());
        if (moderationResponse.getResults().get(0).isFlagged()) {
            throw new GendoxException("MODERATION_CHECK_FAILED", "The question did not pass moderation.", HttpStatus.NOT_ACCEPTABLE);
        }



        List<AiModelMessage> previousMessages = messageService.getPreviousMessages(message, 25);

        // clone message to avoid changing the original message text in DB
        AiModelMessage promptMessage = AiModelMessage.builder()
                .content(question)
                .role(message.getRole() != null ? message.getRole() : "user")
                .build();

        previousMessages.add(promptMessage);

        // TODO detect infinite loop of Agent calling with multiple messages of role "assistant" or "tool".
        // ......

        String apiKey = embeddingService.getApiKey(agent, "COMPLETION_MODEL");

        AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(project.getProjectAgent().getMaxToken())
                .temperature(project.getProjectAgent().getTemperature())
                .topP(project.getProjectAgent().getTopP())
                .build();

        CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                project.getProjectAgent().getAgentBehavior(),
                project.getProjectAgent().getCompletionModel(),
                aiModelRequestParams,
                apiKey,
                availableTools,
                "auto");

        //        completion request audits
        Type completionRequestType = typeService.getAuditLogTypeByName("COMPLETION_REQUEST");
        AuditLogs requestAuditLogs = auditLogsService.createDefaultAuditLogs(completionRequestType);
        requestAuditLogs.setTokenCount((long) completionResponse.getUsage().getPromptTokens());
        requestAuditLogs.setProjectId(project.getId());
        requestAuditLogs.setOrganizationId(project.getOrganizationId());
        auditLogsService.saveAuditLogs(requestAuditLogs);

        //        completion completion audits
        Type completionResponseType = typeService.getAuditLogTypeByName("COMPLETION_RESPONSE");
        AuditLogs completionAuditLogs = auditLogsService.createDefaultAuditLogs(completionResponseType);
        completionAuditLogs.setTokenCount((long) completionResponse.getUsage().getCompletionTokens());
        completionAuditLogs.setProjectId(project.getId());
        completionAuditLogs.setOrganizationId(project.getOrganizationId());
        auditLogsService.saveAuditLogs(completionAuditLogs);

        Message completionResponseMessage = messageAiMessageConverter.toEntity(completionResponse.getChoices().get(0).getMessage());

        completionResponseMessage.setProjectId(project.getId());
        completionResponseMessage.setThreadId(message.getThreadId());
        completionResponseMessage.setCreatedBy(agent.getUserId());
        completionResponseMessage.setUpdatedBy(agent.getUserId());
        completionResponseMessage = messageService.createMessage(completionResponseMessage);

//        return completionResponseMessage;

        List<Message> allResponseMessages = new ArrayList<>();
        allResponseMessages.add(completionResponseMessage);
        List<AiModelMessage> toolResponseMessages;
        // TODO Handle tool calling
        if ("tool_calls".equals(completionResponse.getChoices().getFirst().getFinishReason())) {
            logger.info("Tool calls detected in completion response");
//            completionResponse.getChoices().getFirst().getMessage().setContent(
//                    "Calling tool: " + completionResponse.getChoices().getFirst().getMessage().getToolCalls().get(0).get("function").get("name").asText());

            toolResponseMessages = handleToolExecution(completionResponseMessage, project, agent, availableTools);

            // Save tool response messages.
            toolResponseMessages.forEach(toolResponseMessage -> {
                Message toolResponse = messageAiMessageConverter.toEntity(toolResponseMessage);
                toolResponse.setProjectId(project.getId());
                toolResponse.setThreadId(message.getThreadId());
                toolResponse.setCreatedBy(agent.getUserId());
                toolResponse.setUpdatedBy(agent.getUserId());
                messageService.createMessage(toolResponse);
                allResponseMessages.add(toolResponse);
            });

            // if all tools have response get final completion from the agents
            if (toolResponseMessages.size() == completionResponseMessage.getToolCalls().size()) {
                previousMessages.add(completionResponse.getChoices().get(0).getMessage());
                previousMessages.addAll(toolResponseMessages);

                CompletionResponse finalResponse = getCompletionForMessages(previousMessages,
                        project.getProjectAgent().getAgentBehavior(),
                        project.getProjectAgent().getCompletionModel(),
                        aiModelRequestParams,
                        apiKey,
                        availableTools,
                        "auto");


                Message finalCompletionMessage = messageAiMessageConverter.toEntity(finalResponse.getChoices().get(0).getMessage());

                finalCompletionMessage.setProjectId(project.getId());
                finalCompletionMessage.setThreadId(message.getThreadId());
                finalCompletionMessage.setCreatedBy(agent.getUserId());
                finalCompletionMessage.setUpdatedBy(agent.getUserId());
                finalCompletionMessage = messageService.createMessage(finalCompletionMessage);

                allResponseMessages.add(finalCompletionMessage);
            }
        }


        return allResponseMessages;

    }

    /**
     * TODO enable this from Agent settings
     *
     * This method is used to get the advanced search message to get embedding and apply semantic search.
     * The response of this function will be used to search the vector store, instead of the actual user message.
     *
     * @param message
     * @param project
     * @return
     * @throws GendoxException
     */
    public AiModelMessage getAdvancedSearchCompletion(Message message, Project project) throws GendoxException {
        String question = message.getValue();
        ProjectAgent agent = project.getProjectAgent();
        List<AiTools> advancedSearchTools = List.of(
                AiTools.builder()
                        .type("function")
                        .jsonSchema("""
                                {
                                  "name": "advanced_search",
                                  "description": "Compose a single semantic-search query for the vector store.\\n\\n▸ INPUTS\\n  • Full chat history (chronological) plus the user’s latest turn.\\n\\n▸ WHEN THE USER ASKS A FOLLOW-UP (e.g. “Tell me more”, “Why?”)\\n  • Infer the missing subject from the last few assistant/user messages.\\n  • Focus on the newest context; ignore unrelated earlier turns.\\n\\n▸ QUERY LENGTH RULES\\n  • Let query length scale with the user’s current message:\\n      − If user says something that doesn't require follow-up search, like 'thanks', return empty string in the search_query.\\n      − If the user’s turn is brief (≲ 20 words) → expand with synonyms / related phrases.\\n      − If the turn is long (≫ 100 words) → condense to the core concepts; ~10–50 % of the user’s tokens is fine, it MUST NEVER be more that 4000 characters.\\n\\n▸ QUERY CONTENT RULES\\n  • Preserve the user’s main nouns/verbs.\\n  • Add 2–4 plausible synonyms or closely related terms for each key concept to improve recall.\\n  • Remove filler words, conjunctions, and polite phrases.\\n  • Do NOT answer the question or cite documents—only return the query text.",
                                  "strict": true,
                                  "parameters": {
                                    "type": "object",
                                    "required": ["search_query"],
                                    "properties": {
                                      "search_query": {
                                        "type": "string",
                                        "description": "The query to be used in the vector search in a document DB."
                                      }
                                    },
                                    "additionalProperties": false
                                  }
                                }
                                """)
                        .build());

        List<AiModelMessage> previousMessages = messageService.getPreviousMessages(message, 25);

        // clone message to avoid changing the original message text in DB
        AiModelMessage promptMessage = AiModelMessage.builder()
                .content(question)
                .role(message.getRole() != null ? message.getRole() : "user")
                .build();

        previousMessages.add(promptMessage);

        String apiKey = embeddingService.getApiKey(agent, "COMPLETION_MODEL");

        AiModelRequestParams aiModelRequestParams = AiModelRequestParams.builder()
                .maxTokens(agent.getMaxToken())
                .temperature(agent.getTemperature())
                .topP(agent.getTopP())
                .build();

        CompletionResponse completionResponse = getCompletionForMessages(previousMessages,
                agent.getAgentBehavior(),
                agent.getCompletionModel(),
                aiModelRequestParams,
                apiKey,
                advancedSearchTools,
                "required");

        return completionResponse.getChoices().get(0).getMessage();
    }

    /**
     * executes the tools that requested by the agent in the completion response.
     * returns a list of messages that contains the result of the tool execution.
     *
     * If the tool execution type is "backend" then it executed the function calling
     * if the execution is for the "frontend" then it just returns the message for the frontend to handle it.
     *
     * @param completionResponseMessage
     * @param project
     * @param agent
     * @param availableTools
     * @return
     */
    private List<AiModelMessage> handleToolExecution(Message completionResponseMessage, Project project, ProjectAgent agent, List<AiTools> availableTools) {
        Map<String, AiTools> toolMap = new HashMap<>();
        //map available tools for quick lookup, parse the jsonSchema to JsonNode and find the .function.name property
        availableTools.forEach(tool -> {

            JsonNode functionObj = null; // json_schema is the whole function block
            try {
                functionObj = objectMapper.readTree(tool.getJsonSchema());
            } catch (JsonProcessingException e) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA", "Tool json schema is not a valid JSON", e);
            }
            String toolName = functionObj.get("name").asText();
            toolMap.put(toolName, tool);
        });


        List<AiModelMessage> toolExecutionMessages = new ArrayList<>();

        completionResponseMessage.getToolCalls().forEach(toolCall -> {
            String toolName = toolCall.get("function").get("name").asText();
            AiTools tool = toolMap.get(toolName);
            if (tool == null) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_FOUND", "Tool with name " + toolName + " not found in available tools");
            }

            // TODO add support for actual backend tool execution

            // Here you would execute the tool using the toolCall parameters and the tool's jsonSchema
            // For now, we will just support frontend actions with no feedback to the llm
            AiModelMessage message = new AiModelMessage();
            message.setRole("tool");
            message.setToolCallId(toolCall.get("id").asText());
            message.setName(toolName);
            message.setContent("{\"status\": \"executed\"}");
            toolExecutionMessages.add(message);
        });

        return toolExecutionMessages;
    }


    public String convertToAiModelTextQuestion(Message message, List<DocumentInstanceSectionDTO> nearestSections, UUID projectId) throws GendoxException {

        // TODO investigate if we want to split the context and question
        //  to 2 different messages with role: "contextProvider" and role: "user"

        // take the types name
        ProjectAgent agent = projectAgentRepository.findByProjectId(projectId);
        Template agentSectionTemplate = templateRepository.findByIdIs(agent.getSectionTemplateId());
        Template agentChatTemplate = templateRepository.findByIdIs(agent.getChatTemplateId());

        List<String> documentTitles = nearestSections.stream()
                .map(section -> documentUtils.extractDocumentNameFromUrl(section.getDocumentInstanceDTO().getRemoteUrl()))
                .toList();

        // run sectionTemplate
        SectionTemplateAuthor sectionTemplateAuthor = new SectionTemplateAuthor();

        String sectionValues = sectionTemplateAuthor.sectionValues(nearestSections, agentSectionTemplate.getText(), documentTitles);

        // run chatTemplate
        ChatTemplateAuthor chatTemplateAuthor = new ChatTemplateAuthor();

        String question = chatTemplateAuthor.chatTemplate(message, sectionValues, agentChatTemplate.getText());


        return question;


    }


}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.subagents;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

import static java.util.stream.Collectors.joining;

/**
 * A summarizer sub-agent that carries the full parent-thread conversation as context.
 *
 * <p>Unlike {@link CreateSubAgentTool}, which spawns a blank new thread, this tool
 * prepends the parent thread's message history into the sub-agent message text so the
 * sub-agent can summarise or extract information that was already discussed.
 */
@Component
public class SummarizerSubAgentTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(SummarizerSubAgentTool.class);

    private final CompletionService completionService;
    private final MessageService messageService;
    private final ObjectMapper objectMapper;
    private final CreateSubAgentTool createSubAgentTool;
    private final DocumentSectionExtractorTool documentSectionExtractorTool;

    public SummarizerSubAgentTool(@Lazy CompletionService completionService,
                                  MessageService messageService,
                                  ObjectMapper objectMapper, CreateSubAgentTool createSubAgentTool, DocumentSectionExtractorTool documentSectionExtractorTool) {
        this.completionService = completionService;
        this.messageService = messageService;
        this.objectMapper = objectMapper;
        this.createSubAgentTool = createSubAgentTool;
        this.documentSectionExtractorTool = documentSectionExtractorTool;
    }

    @Override
    public String getName() {
        return "summarize";
    }

    @Override
    public String getDescription() {
        return "Summarize documents or extract focused information from them. " +
                "The sub-agent receives the full conversation history as context and performs " +
                "the summarization task described in the task_description. " +
                "Use this when you need a condensed, targeted summary of a document or a set of findings.";
    }

    @Override
    public JsonNode getParametersSchema() {
        String schemaJson = """
                {
                  "type": "object",
                  "required": ["task_description"],
                  "properties": {
                    "task_description": {
                      "type": "string",
                      "description": "A clear description of what to summarize and what information to extract. Example: 'Summarize all payment-related clauses from the contract.'"
                    },
                    "system_instructions": {
                      "type": "string",
                      "description": "Optional role or behavioral instructions for the summarizer sub-agent."
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in SummarizerSubAgentTool", e);
        }
    }

    @Override
    public JsonNode execute(JsonNode argumentsNode, ToolExecutionContext context) throws GendoxException {
        JsonNode arguments;
        try {
            arguments = objectMapper.readTree(argumentsNode.asText());
        } catch (Exception e) {
            try {
                arguments = argumentsNode.isObject() ? argumentsNode : objectMapper.readTree(argumentsNode.toString());
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid tool arguments JSON: " + argumentsNode, ex);
            }
        }

        String taskDescription = arguments.get("task_description").asText();
        String systemInstructions = arguments.has("system_instructions")
                ? arguments.get("system_instructions").asText()
                : null;

        logger.debug("SummarizerSubAgentTool: running summarization task: {}",
                taskDescription.substring(0, Math.min(taskDescription.length(), 100)));

        // Prepend the parent-thread conversation into the message text so the sub-agent
        // has full context without any changes to CompletionService's history loading.
        List<AiModelMessage> parentThreadHistory = context.parentPreviousMessages();

        String promptMessageText = buildMessage(systemInstructions, taskDescription);

        Message subAgentMessage = new Message();
        subAgentMessage.setValue(promptMessageText);
        subAgentMessage.setRole("user");
        subAgentMessage.setProjectId(context.parentMessage().getProjectId());
        subAgentMessage.setAdditionalResources(new ArrayList<>());
        // Save before getCompletion: MessageService creates a new ChatThread and assigns threadId,
        // so every message produced inside this sub-agent's loop shares the same thread.
        subAgentMessage = messageService.createMessage(subAgentMessage);

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(context.cancellationToken())
                // Prevent this sub-agent from spawning further sub-agents.
                .excludedToolNames(List.of(this.getName(), createSubAgentTool.getName(), documentSectionExtractorTool.getName()))
                .build();

        if (parentThreadHistory != null && !parentThreadHistory.isEmpty()) {
            overrides.setPreviousMessages(parentThreadHistory);
        }
        

        try {
            List<Message> subAgentResponses = completionService.getCompletion(
                    subAgentMessage,
                    new ArrayList<>(),
                    context.project(),
                    null,
                    overrides
            );

            String finalResponse = subAgentResponses.stream()
                    .filter(m -> "assistant".equals(m.getRole()))
                    .reduce((first, second) -> second)
                    .map(Message::getValue)
                    .orElse("Summarizer sub-agent completed but produced no response.");

            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "completed");
            result.put("summary", finalResponse);
            result.put("message_count", subAgentResponses.size());

            logger.info("SummarizerSubAgentTool: completed with {} messages", subAgentResponses.size());
            return result;

        } catch (GendoxException e) {
            if ("DEEP_THINKING_CANCELLED".equals(e.getErrorCode())) {
                throw e;
            }
            logger.error("Summarizer sub-agent execution failed: {}", e.getMessage(), e);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "failed");
            result.put("error", e.getMessage());
            return result;
        }
    }

    /**
     * Formats the parent-thread history as a readable block and prepends it to the
     * task description so the sub-agent message is self-contained.
     */
    private String buildMessage(String systemInstructions, String taskDescription) {

        return """
                You are the Summarizer Sub-Agent. Dont delegate your task to any other sub-agent. You MUST answer the question yourself. It is forbidden to create any other sub-agent, or summarizer. You MUST answer the question yourself. 
                <system_instructions>
                %s
                </system_instructions>

                <task_description>
                %s
                </task_description>
                """.formatted(systemInstructions, taskDescription);
    }
}

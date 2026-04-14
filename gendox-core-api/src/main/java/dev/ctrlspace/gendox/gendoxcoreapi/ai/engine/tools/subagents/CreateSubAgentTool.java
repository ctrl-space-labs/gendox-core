package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.subagents;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
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

@Component
public class CreateSubAgentTool implements AiToolHandler {

    private static final Logger logger = LoggerFactory.getLogger(CreateSubAgentTool.class);

    private final CompletionService completionService;
    private final MessageService messageService;
    private final ObjectMapper objectMapper;

    public CreateSubAgentTool(@Lazy CompletionService completionService,
                              MessageService messageService,
                              ObjectMapper objectMapper) {
        this.completionService = completionService;
        this.messageService = messageService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getName() {
        return "create_sub_agent";
    }

    @Override
    public String getDescription() {
        return "Create a sub-agent to perform a specific research or analysis task. " +
                "The sub-agent will execute independently and return its findings.";
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
                      "description": "A clear description of the task the sub-agent should perform."
                    },
                    "system_instructions": {
                      "type": "string",
                      "description": "Optional system-level instructions for the sub-agent's behavior and role."
                    }
                  },
                  "additionalProperties": false
                }
                """;
        try {
            return objectMapper.readTree(schemaJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Invalid JSON schema in CreateSubAgentTool", e);
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

        logger.debug("CreateSubAgentTool: spawning sub-agent for task: {}",
                taskDescription.substring(0, Math.min(taskDescription.length(), 100)));

        Message subAgentMessage = new Message();
        subAgentMessage.setValue(taskDescription);
        subAgentMessage.setRole("user");
        subAgentMessage.setProjectId(context.parentMessage().getProjectId());
        subAgentMessage.setAdditionalResources(new ArrayList<>());
        // Save before getCompletion: MessageService creates a new ChatThread and assigns threadId,
        // so every message produced inside this sub-agent's loop shares the same thread.
        subAgentMessage = messageService.createMessage(subAgentMessage);

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(context.cancellationToken())
                .build();

        if (systemInstructions != null && !systemInstructions.isBlank()) {
            overrides.setSystemPrompt(systemInstructions);
        }

        try {
            // TODO think if i want to pass the text from the 1st user message.
            //  This could accelerate the sub-agent, and enable cost savings by improving cache hits.

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
                    .orElse("Sub-agent completed but produced no response.");

            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "completed");
            result.put("response", finalResponse);
            result.put("message_count", subAgentResponses.size());

            logger.info("CreateSubAgentTool: sub-agent completed with {} messages", subAgentResponses.size());

            return result;
        } catch (GendoxException e) {
            if ("DEEP_THINKING_CANCELLED".equals(e.getErrorCode())) {
                throw e;
            }
            logger.error("Sub-agent execution failed: {}", e.getMessage(), e);
            ObjectNode result = objectMapper.createObjectNode();
            result.put("status", "failed");
            result.put("error", e.getMessage());
            return result;
        }
    }
}

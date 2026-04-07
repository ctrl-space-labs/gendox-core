package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AnthropicMessagesConverter {

    private final ObjectMapper objectMapper;

    public AnthropicMessagesConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public record MappedAnthropicMessages(List<AnthropicCompletionRequest.Message> messages, String system) {
    }

    public MappedAnthropicMessages mapMessages(List<AiModelMessage> messages) {
        List<AnthropicCompletionRequest.Message> out = new ArrayList<>();
        StringBuilder systemSb = new StringBuilder();
        List<AiModelMessage> toolBatch = new ArrayList<>();

        for (AiModelMessage m : messages) {
            String role = m.getRole();
            if ("system".equals(role)) {
                flushToolBatch(out, toolBatch);
                if (!systemSb.isEmpty()) {
                    systemSb.append("\n\n");
                }
                String text = m.getContent() != null ? m.getContent() : "";
                systemSb.append(text);
                continue;
            }
            if ("tool".equals(role)) {
                toolBatch.add(m);
                continue;
            }
            flushToolBatch(out, toolBatch);
            out.add(mapUserOrAssistant(m));
        }
        flushToolBatch(out, toolBatch);

        String system = systemSb.isEmpty() ? null : systemSb.toString();
        return new MappedAnthropicMessages(out, system);
    }

    private void flushToolBatch(List<AnthropicCompletionRequest.Message> out, List<AiModelMessage> toolBatch) {
        if (toolBatch.isEmpty()) {
            return;
        }
        ArrayNode content = objectMapper.createArrayNode();
        for (AiModelMessage t : toolBatch) {
            ObjectNode block = objectMapper.createObjectNode();
            block.put("type", "tool_result");
            block.put("tool_use_id", t.getToolCallId() != null ? t.getToolCallId() : "");
            block.put("content", t.getContent() != null ? t.getContent() : "");
            content.add(block);
        }
        out.add(AnthropicCompletionRequest.Message.builder()
                .role("user")
                .content(content)
                .build());
        toolBatch.clear();
    }

    private AnthropicCompletionRequest.Message mapUserOrAssistant(AiModelMessage m) {
        String role = m.getRole();
        if ("assistant".equals(role) && m.getToolCalls() != null && m.getToolCalls().isArray() && !m.getToolCalls().isEmpty()) {
            ArrayNode blocks = objectMapper.createArrayNode();
            if (m.getContent() != null && !m.getContent().isBlank()) {
                ObjectNode textBlock = objectMapper.createObjectNode();
                textBlock.put("type", "text");
                textBlock.put("text", m.getContent());
                blocks.add(textBlock);
            }
            for (JsonNode call : m.getToolCalls()) {
                blocks.add(openAiToolCallToAnthropicToolUse(call));
            }
            return AnthropicCompletionRequest.Message.builder()
                    .role("assistant")
                    .content(blocks)
                    .build();
        }
        String text = m.getContent() != null ? m.getContent() : "";
        return AnthropicCompletionRequest.Message.builder()
                .role(role)
                .content(objectMapper.getNodeFactory().textNode(text))
                .build();
    }

    private ObjectNode openAiToolCallToAnthropicToolUse(JsonNode call) {
        JsonNode idNode = call.get("id");
        JsonNode function = call.get("function");
        String id = idNode != null && !idNode.isNull() ? idNode.asText() : "";
        String name = "";
        JsonNode input = objectMapper.createObjectNode();
        if (function != null && !function.isNull()) {
            JsonNode nameNode = function.get("name");
            if (nameNode != null && !nameNode.isNull()) {
                name = nameNode.asText();
            }
            input = parseToolArguments(function.get("arguments"));
        }
        ObjectNode block = objectMapper.createObjectNode();
        block.put("type", "tool_use");
        block.put("id", id);
        block.put("name", name);
        block.set("input", input);
        return block;
    }

    private JsonNode parseToolArguments(JsonNode arguments) {
        if (arguments == null || arguments.isNull()) {
            return objectMapper.createObjectNode();
        }
        if (arguments.isTextual()) {
            String raw = arguments.asText();
            if (raw.isBlank()) {
                return objectMapper.createObjectNode();
            }
            try {
                return objectMapper.readTree(raw);
            } catch (JsonProcessingException e) {
                throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_ARGUMENTS_INVALID_JSON",
                        "Tool call arguments are not valid JSON", e);
            }
        }
        if (arguments.isObject()) {
            return arguments;
        }
        return objectMapper.createObjectNode();
    }

    public AnthropicCompletionRequest.ToolDefinition toAnthropicToolDefinition(AiTools entity) {
        JsonNode fnObj;
        try {
            fnObj = objectMapper.readTree(entity.getJsonSchema());
        } catch (JsonProcessingException e) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA",
                    "Tool json schema is not a valid JSON", e);
        }
        JsonNode nameNode = fnObj.get("name");
        String name = nameNode != null && nameNode.isTextual() ? nameNode.asText() : "";
        JsonNode descNode = fnObj.get("description");
        String description = descNode != null && descNode.isTextual() ? descNode.asText() : "";
        JsonNode parameters = fnObj.get("parameters");
        JsonNode inputSchema = (parameters != null && parameters.isObject()) ? parameters : defaultObjectSchema();
        return AnthropicCompletionRequest.ToolDefinition.builder()
                .name(name)
                .description(description)
                .inputSchema(inputSchema)
                .build();
    }

    /**
     * Anthropic's Messages API expects {@code tool_choice} as an object (e.g. {@code {"type":"auto"}}), not a string.
     */
    public JsonNode mapToolChoice(String toolChoice) {
        if (toolChoice == null || toolChoice.isBlank() || "auto".equalsIgnoreCase(toolChoice)) {
            return objectMapper.createObjectNode().put("type", "auto");
        }
        if ("required".equalsIgnoreCase(toolChoice)) {
            return objectMapper.createObjectNode().put("type", "any");
        }
        if ("none".equalsIgnoreCase(toolChoice)) {
            return objectMapper.createObjectNode().put("type", "none");
        }
        String trimmed = toolChoice.trim();
        if (trimmed.startsWith("{")) {
            try {
                JsonNode parsed = objectMapper.readTree(trimmed);
                if (parsed.isObject()) {
                    return parsed;
                }
            } catch (JsonProcessingException ignored) {
                // fall through to default
            }
        }
        return objectMapper.createObjectNode().put("type", "auto");
    }

    private ObjectNode defaultObjectSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.set("properties", objectMapper.createObjectNode());
        return schema;
    }
}

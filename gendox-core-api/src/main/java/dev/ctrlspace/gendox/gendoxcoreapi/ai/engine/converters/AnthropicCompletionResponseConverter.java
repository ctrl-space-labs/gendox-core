package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class AnthropicCompletionResponseConverter {

    private final ObjectMapper objectMapper;

    public AnthropicCompletionResponseConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public CompletionResponse toCompletionResponse(AnthropicCompletionResponse anthropicCompletionResponse) {
        AnthropicCompletionResponse.Usage anthropicUsage = anthropicCompletionResponse.getUsage();
        int inTok = anthropicUsage != null && anthropicUsage.getInput_tokens() != null ? anthropicUsage.getInput_tokens() : 0;
        int outTok = anthropicUsage != null && anthropicUsage.getOutput_tokens() != null ? anthropicUsage.getOutput_tokens() : 0;
        Usage.PromptTokensDetail promptTokensDetail = mapAnthropicPromptTokensDetail(anthropicUsage);
        Usage usage = Usage.builder()
                .completionTokens(outTok)
                .promptTokens(inTok)
                .totalTokens(inTok + outTok)
                .promptTokensDetail(promptTokensDetail)
                .build();

        List<String> textParts = new ArrayList<>();
        ArrayNode toolCallsArray = objectMapper.createArrayNode();
        List<AnthropicCompletionResponse.Content> contents = anthropicCompletionResponse.getContent();
        if (contents != null) {
            for (AnthropicCompletionResponse.Content c : contents) {
                if (c == null) {
                    continue;
                }
                if ("tool_use".equals(c.getType())) {
                    toolCallsArray.add(anthropicToolUseToOpenAiToolCall(c));
                } else if ("text".equals(c.getType()) || (c.getType() == null && c.getText() != null)) {
                    if (c.getText() != null && !c.getText().isEmpty()) {
                        textParts.add(c.getText());
                    }
                }
            }
        }

        String joinedText = textParts.isEmpty() ? null : String.join("\n", textParts);

        String stopReason = anthropicCompletionResponse.getStop_reason();
        String finishReason;
        if ("tool_use".equals(stopReason)) {
            finishReason = "tool_calls";
        } else if ("end_turn".equals(stopReason)) {
            finishReason = "stop";
        } else {
            finishReason = stopReason;
        }

        AiModelMessage.AiModelMessageBuilder messageBuilder = AiModelMessage.builder()
                .role(anthropicCompletionResponse.getRole())
                .content(joinedText);
        if (!toolCallsArray.isEmpty()) {
            messageBuilder.toolCalls(toolCallsArray);
        }

        Choice choice = Choice.builder()
                .index(0)
                .finishReason(finishReason)
                .message(messageBuilder.build())
                .build();

        return CompletionResponse.builder()
                .id(anthropicCompletionResponse.getId())
                .model(anthropicCompletionResponse.getModel())
                .usage(usage)
                .choices(List.of(choice))
                .build();
    }

    private ObjectNode anthropicToolUseToOpenAiToolCall(AnthropicCompletionResponse.Content c) {
        ObjectNode call = objectMapper.createObjectNode();
        call.put("id", c.getId() != null ? c.getId() : "");
        call.put("type", "function");
        ObjectNode function = objectMapper.createObjectNode();
        function.put("name", c.getName() != null ? c.getName() : "");
        String argsJson;
        try {
            JsonNode input = c.getInput();
            if (input == null || input.isNull()) {
                argsJson = "{}";
            } else {
                argsJson = objectMapper.writeValueAsString(input);
            }
        } catch (JsonProcessingException e) {
            argsJson = "{}";
        }
        function.put("arguments", argsJson);
        call.set("function", function);
        return call;
    }

    /**
     * Maps Anthropic {@code usage} cache fields into the OpenAI-shaped {@link Usage} detail object so
     * {@link dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionService#saveCompletionAuditLogs}
     * can record cache reads via {@code cached_tokens} and retain write breakdowns.
     */
    private static Usage.PromptTokensDetail mapAnthropicPromptTokensDetail(AnthropicCompletionResponse.Usage anthropicUsage) {
        if (anthropicUsage == null) {
            return null;
        }
        boolean anyCache = anthropicUsage.getCache_read_input_tokens() != null
                || anthropicUsage.getCache_creation_input_tokens() != null
                || anthropicUsage.getCache_creation() != null;
        if (!anyCache) {
            return null;
        }
        Usage.PromptTokensDetail.PromptCacheCreation promptCacheCreation = null;
        AnthropicCompletionResponse.Usage.CacheCreation cc = anthropicUsage.getCache_creation();
        if (cc != null && (cc.getEphemeral5mInputTokens() != null || cc.getEphemeral1hInputTokens() != null)) {
            promptCacheCreation = Usage.PromptTokensDetail.PromptCacheCreation.builder()
                    .ephemeral5mInputTokens(cc.getEphemeral5mInputTokens())
                    .ephemeral1hInputTokens(cc.getEphemeral1hInputTokens())
                    .build();
        }
        return Usage.PromptTokensDetail.builder()
                .cachedTokens(anthropicUsage.getCache_read_input_tokens())
                .cacheCreationInputTokens(anthropicUsage.getCache_creation_input_tokens())
                .cacheCreation(promptCacheCreation)
                .build();
    }
}

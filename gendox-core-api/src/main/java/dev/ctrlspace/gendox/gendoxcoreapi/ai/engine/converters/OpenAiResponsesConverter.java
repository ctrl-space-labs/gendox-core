package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.OpenAiResponsesItem;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiResponsesRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiResponsesResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.type.TypeReference;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Translates between Gendox's message shape and the Responses API's item array,
 * so nothing downstream knows which OpenAI endpoint was used.
 */
@Component
public class OpenAiResponsesConverter {

    private static final Logger logger = LoggerFactory.getLogger(OpenAiResponsesConverter.class);

    private final ObjectMapper objectMapper;

    public OpenAiResponsesConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ------------------------------------------------------------------
    // Gendox messages -> Responses input array
    // ------------------------------------------------------------------

    // System messages are skipped; Responses carries the prompt in {@code instructions}.
    public List<OpenAiResponsesItem> toInputItems(List<AiModelMessage> messages, UUID currentModelId) {
        List<OpenAiResponsesItem> input = new ArrayList<>();

        for (AiModelMessage message : messages) {
            String role = message.getRole();

            if ("system".equals(role) || "developer".equals(role)) {
                continue;
            }

            if ("tool".equals(role)) {
                input.add(new OpenAiResponsesItem.FunctionCallOutput(
                        message.getToolCallId() == null ? "" : message.getToolCallId(),
                        message.getContent() == null ? "" : message.getContent()));
                continue;
            }

            if ("assistant".equals(role)) {
                appendAssistantItems(input, message, currentModelId);
                continue;
            }

            input.add(toMessageItem(role == null ? "user" : role, message));
        }

        return input;
    }

    // Reasoning first: it is the state the text and tool calls were produced from.
    private void appendAssistantItems(List<OpenAiResponsesItem> input, AiModelMessage message, UUID currentModelId) {
        // encrypted_content is what OpenAI validates, and it round-trips as a plain string field.
        if (message.getReasoningMetadata() != null && !message.getReasoningMetadata().isNull()
                && currentModelId.equals(message.getAiModelId())) {
            input.addAll(objectMapper.convertValue(message.getReasoningMetadata(), new TypeReference<>() {
            }));
        }

        if (message.getContent() != null && !message.getContent().isBlank()) {
            input.add(toMessageItem("assistant", message));
        }

        if (message.getToolCalls() != null && message.getToolCalls().isArray()) {
            for (JsonNode call : message.getToolCalls()) {
                input.add(toFunctionCall(call));
            }
        }
    }

    private OpenAiResponsesItem.Message toMessageItem(String role, AiModelMessage message) {
        String text = message.getContent() == null ? "" : message.getContent();
        OpenAiResponsesItem.Content content = "assistant".equals(role)
                ? OpenAiResponsesItem.Content.outputText(text)
                : OpenAiResponsesItem.Content.inputText(text);
        return new OpenAiResponsesItem.Message(role, List.of(content));
    }

    private OpenAiResponsesItem.FunctionCall toFunctionCall(JsonNode openAiToolCall) {
        JsonNode function = openAiToolCall.get("function");
        return new OpenAiResponsesItem.FunctionCall(
                textOf(openAiToolCall.get("id")),
                function == null ? "" : textOf(function.get("name")),
                function == null ? "{}" : textOf(function.get("arguments"), "{}"));
    }

    /** Flat here; Chat Completions nests the same fields under "function". */
    public OpenAiResponsesRequest.ToolDto toToolDto(AiTools entity) {
        JsonNode fn;
        try {
            fn = objectMapper.readTree(entity.getJsonSchema());
        } catch (JsonProcessingException e) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "AI_TOOL_NOT_PROPER_JSON_SCHEMA",
                    "Tool json schema is not a valid JSON", e);
        }

        return OpenAiResponsesRequest.ToolDto.builder()
                .type(entity.getType() == null ? "function" : entity.getType())
                .name(textOf(fn.get("name")))
                .description(textOf(fn.get("description")))
                .parameters(fn.get("parameters"))
                .build();
    }

    // ------------------------------------------------------------------
    // Responses output array -> Gendox CompletionResponse
    // ------------------------------------------------------------------

    public CompletionResponse toCompletionResponse(OpenAiResponsesResponse response) {
        List<String> textParts = new ArrayList<>();
        List<String> reasoningParts = new ArrayList<>();
        List<OpenAiResponsesItem> reasoningItems = new ArrayList<>();
        ArrayNode toolCalls = objectMapper.createArrayNode();

        if (response.getOutput() != null) {
            for (OpenAiResponsesItem item : response.getOutput()) {
                switch (item) {
                    case OpenAiResponsesItem.Reasoning reasoning -> {
                        collectReasoningSummary(reasoning, reasoningParts);
                        reasoningItems.add(reasoning);
                    }
                    case OpenAiResponsesItem.Message message -> collectOutputText(message, textParts);
                    case OpenAiResponsesItem.FunctionCall call -> toolCalls.add(toOpenAiToolCall(call));
                    // Built-in tools surface as other item types; Gendox enables none.
                    default -> { }
                }
            }
        }

        logger.debug("Responses output items: {}, reasoning items: {}, summary parts: {}, tool calls: {}",
                response.getOutput() == null ? 0 : response.getOutput().size(),
                reasoningItems.size(), reasoningParts.size(), toolCalls.size());

        AiModelMessage.AiModelMessageBuilder messageBuilder = AiModelMessage.builder()
                .role("assistant")
                .content(textParts.isEmpty() ? null : String.join("\n", textParts));

        if (!toolCalls.isEmpty()) {
            messageBuilder.toolCalls(toolCalls);
        }

        if (!reasoningItems.isEmpty()) {
            messageBuilder.reasoningContent(reasoningParts.isEmpty() ? null : String.join("\n\n", reasoningParts))
                    .reasoningMetadata(objectMapper.valueToTree(reasoningItems));
        }

        Choice choice = Choice.builder()
                .index(0)
                .finishReason(toFinishReason(response, !toolCalls.isEmpty()))
                .message(messageBuilder.build())
                .build();

        return CompletionResponse.builder()
                .id(response.getId())
                .object(response.getObject())
                .created(response.getCreated())
                .model(response.getModel())
                .usage(toUsage(response.getUsage()))
                .choices(List.of(choice))
                .build();
    }

    // The summary can legitimately be empty; encrypted_content is kept regardless.
    private void collectReasoningSummary(OpenAiResponsesItem.Reasoning reasoning, List<String> into) {
        if (reasoning.summary() == null) {
            return;
        }
        for (OpenAiResponsesItem.SummaryPart part : reasoning.summary()) {
            if (part.text() != null && !part.text().isEmpty()) {
                into.add(part.text());
            }
        }
    }

    private void collectOutputText(OpenAiResponsesItem.Message message, List<String> into) {
        if (message.content() == null) {
            return;
        }
        for (OpenAiResponsesItem.Content part : message.content()) {
            if ("output_text".equals(part.type()) && part.text() != null && !part.text().isEmpty()) {
                into.add(part.text());
            }
        }
    }

    // Back to the Chat-Completions shape the rest of Gendox handles.
    private ObjectNode toOpenAiToolCall(OpenAiResponsesItem.FunctionCall functionCall) {
        ObjectNode call = objectMapper.createObjectNode();
        // call_id pairs with function_call_output; id is the item's own.
        call.put("id", functionCall.callId() == null ? "" : functionCall.callId());
        call.put("type", "function");

        ObjectNode function = objectMapper.createObjectNode();
        function.put("name", functionCall.name() == null ? "" : functionCall.name());
        function.put("arguments", functionCall.arguments() == null ? "{}" : functionCall.arguments());
        call.set("function", function);

        return call;
    }

    private String toFinishReason(OpenAiResponsesResponse response, boolean hasToolCalls) {
        if (hasToolCalls) {
            return "tool_calls";
        }
        if ("incomplete".equals(response.getStatus())) {
            // Usually max_output_tokens; "length" keeps existing handling.
            return "length";
        }
        return "stop";
    }

    private Usage toUsage(OpenAiResponsesResponse.ResponsesUsage responsesUsage) {
        if (responsesUsage == null) {
            return Usage.builder().promptTokens(0).completionTokens(0).totalTokens(0).build();
        }

        Usage.UsageBuilder usage = Usage.builder()
                .promptTokens(responsesUsage.getInputTokens() == null ? 0 : responsesUsage.getInputTokens())
                .completionTokens(responsesUsage.getOutputTokens() == null ? 0 : responsesUsage.getOutputTokens())
                .totalTokens(responsesUsage.getTotalTokens() == null ? 0 : responsesUsage.getTotalTokens());

        if (responsesUsage.getInputTokensDetails() != null) {
            usage.promptTokensDetail(Usage.PromptTokensDetail.builder()
                    .cachedTokens(responsesUsage.getInputTokensDetails().getCachedTokens())
                    .build());
        }

        if (responsesUsage.getOutputTokensDetails() != null) {
            Usage.CompletionTokensDetails details = new Usage.CompletionTokensDetails();
            details.setReasoningTokens(responsesUsage.getOutputTokensDetails().getReasoningTokens());
            usage.completionTokensDetail(details);
        }

        return usage.build();
    }

    private static String textOf(JsonNode node) {
        return textOf(node, "");
    }

    private static String textOf(JsonNode node, String fallback) {
        return node == null || node.isNull() ? fallback : node.asText();
    }
}

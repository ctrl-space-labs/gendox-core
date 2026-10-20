package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.ProviderStreamClient.Protocol;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.function.Consumer;

/**
 * Builds a provider's ordinary (non-streaming) response from its stream frames, so the existing
 * response converters, persistence and audit logs are used unchanged. Readable text and reasoning
 * are passed to the listener as they arrive; signatures only end up in the built response.
 */
public final class StreamAccumulator {

    private final ObjectMapper mapper;
    private final Protocol protocol;
    private final Consumer<CompletionDelta> listener;
    private final ObjectNode response;
    private final ObjectNode message;
    // Tool calls and (Anthropic) content blocks arrive in pieces, keyed by their index
    private final SortedMap<Integer, ObjectNode> calls = new TreeMap<>();
    private final SortedMap<Integer, ObjectNode> blocks = new TreeMap<>();
    private final Map<Integer, StringBuilder> toolInputs = new HashMap<>();
    // Chat content as the provider sent it, inline thought tags included
    private final StringBuilder rawContent = new StringBuilder();
    private final StringBuilder content = new StringBuilder();
    private final StringBuilder reasoning = new StringBuilder();
    private final InlineThoughtStream thoughts;
    private boolean ended;

    public StreamAccumulator(ObjectMapper mapper, Protocol protocol, Consumer<CompletionDelta> listener) {
        this.mapper = mapper;
        this.protocol = protocol;
        this.listener = listener;
        this.response = mapper.createObjectNode();
        this.message = mapper.createObjectNode().put("role", "assistant");
        this.thoughts = new InlineThoughtStream(this::emit);
    }

    public void accept(String event, String data) {
        if (data.equals("[DONE]")) {
            ended = true;
            return;
        }

        JsonNode node = readJson(data);
        String type = node.path("type").asText(event);
        if (type.equals("error") || type.equals("response.failed") || node.hasNonNull("error")) {
            throw new IllegalStateException("Provider stream failed");
        }
        switch (protocol) {
            case CHAT, MISTRAL -> chat(node);
            case RESPONSES -> responses(type, node);
            case ANTHROPIC -> anthropic(type, node);
            case COHERE -> cohere(type, node);
        }
    }

    /** The response in the provider's non-streaming shape. */
    public ObjectNode finish() {
        thoughts.finish();
        if (!ended) {
            throw new IllegalStateException("Provider stream ended before completion");
        }
        return switch (protocol) {
            case RESPONSES -> response;
            case ANTHROPIC -> finishAnthropic();
            case COHERE -> finishCohere();
            case CHAT, MISTRAL -> finishChat();
        };
    }

    // OpenAI-compatible chat completions (and Mistral, which differs only in its thinking chunks)
    private void chat(JsonNode node) {
        for (String key : List.of("id", "model", "object", "created")) {
            if (node.has(key)) {
                response.set(key, node.get(key));
            }
        }
        if (node.hasNonNull("usage")) {
            response.set("usage", node.get("usage"));
        }
        if (node.path("x_groq").hasNonNull("usage")) {
            response.set("usage", node.path("x_groq").get("usage"));
        }

        for (JsonNode choice : node.path("choices")) {
            if (choice.path("index").asInt() != 0) {
                continue;
            }
            JsonNode delta = choice.path("delta");
            chatContent(delta.get("content"));
            emit("reasoningContent", delta.path("reasoning_content").asText(delta.path("reasoning").asText("")));
            if (delta.hasNonNull("extra_content")) {
                message.set("extra_content", delta.get("extra_content"));
            }
            for (JsonNode call : delta.path("tool_calls")) {
                mergeCall(call.path("index").asInt(), call);
            }
            if (choice.hasNonNull("finish_reason")) {
                response.set("finish_reason", choice.get("finish_reason"));
            }
        }
    }

    private void chatContent(JsonNode text) {
        if (text == null) {
            return;
        }
        if (text.isTextual()) {
            rawContent.append(text.asText());
            thoughts.append(text.asText());
            return;
        }
        if (!text.isArray()) {
            return;
        }
        // Mistral sends content as typed chunks
        for (JsonNode part : text) {
            String partType = part.path("type").asText();
            if (partType.equals("thinking")) {
                emitThinking(part);
            }
            if (partType.equals("text")) {
                thoughts.append(part.path("text").asText(""));
            }
        }
    }

    private void emitThinking(JsonNode part) {
        JsonNode thinking = part.get("thinking");
        if (thinking == null) {
            emit("reasoningContent", part.path("text").asText(""));
            return;
        }
        if (!thinking.isArray()) {
            emit("reasoningContent", thinking.asText(""));
            return;
        }
        for (JsonNode inner : thinking) {
            emit("reasoningContent", inner.path("text").asText(""));
        }
    }

    // OpenAI Responses API: the terminal event carries the authoritative full response
    private void responses(String type, JsonNode node) {
        if (type.equals("response.output_text.delta")) {
            emit("value", node.path("delta").asText());
        }
        if (type.equals("response.reasoning_summary_text.delta")) {
            emit("reasoningContent", node.path("delta").asText());
        }
        if (type.equals("response.completed") || type.equals("response.incomplete")) {
            response.removeAll();
            response.setAll((ObjectNode) node.get("response"));
            ended = true;
        }
    }

    private void anthropic(String type, JsonNode node) {
        int index = node.path("index").asInt();
        switch (type) {
            case "message_start" -> response.setAll((ObjectNode) node.get("message"));
            case "content_block_start" -> blocks.put(index, ((ObjectNode) node.get("content_block")).deepCopy());
            case "content_block_delta" -> anthropicDelta(index, node.path("delta"));
            case "content_block_stop" -> finishToolInput(index);
            case "message_delta" -> {
                response.setAll((ObjectNode) node.path("delta"));
                ObjectNode usage = response.withObject("/usage");
                if (node.path("usage").isObject()) {
                    usage.setAll((ObjectNode) node.get("usage"));
                }
            }
            case "message_stop" -> ended = true;
            default -> {
            }
        }
    }

    private void anthropicDelta(int index, JsonNode delta) {
        ObjectNode block = blocks.get(index);
        if (block == null) {
            throw new IllegalStateException("Delta without content block");
        }
        switch (delta.path("type").asText()) {
            case "text_delta" -> {
                append(block, "text", delta.path("text").asText());
                emit("value", delta.path("text").asText());
            }
            case "thinking_delta" -> {
                append(block, "thinking", delta.path("thinking").asText());
                emit("reasoningContent", delta.path("thinking").asText());
            }
            case "signature_delta" -> append(block, "signature", delta.path("signature").asText());
            case "input_json_delta" -> toolInputs.computeIfAbsent(index, i -> new StringBuilder())
                    .append(delta.path("partial_json").asText());
            default -> {
            }
        }
    }

    private void finishToolInput(int index) {
        if (!toolInputs.containsKey(index)) {
            return;
        }
        blocks.get(index).set("input", readJson(toolInputs.get(index).toString()));
    }

    private void cohere(String type, JsonNode node) {
        JsonNode delta = node.path("delta");
        switch (type) {
            case "message-start" -> response.put("id", node.path("id").asText());
            case "content-delta" -> emit("value", delta.path("message").path("content").path("text").asText(""));
            case "tool-plan-delta" -> emit("reasoningContent", delta.path("message").path("tool_plan").asText(""));
            case "tool-call-start", "tool-call-delta" -> mergeCall(node.path("index").asInt(), delta.path("message").path("tool_calls"));
            case "message-end" -> {
                response.setAll((ObjectNode) delta);
                ended = true;
            }
            default -> {
            }
        }
    }

    private ObjectNode finishAnthropic() {
        ArrayNode contentBlocks = response.putArray("content");
        blocks.values().forEach(contentBlocks::add);
        return response;
    }

    private ObjectNode finishChat() {
        message.put("content", chatContentText());
        if (!reasoning.isEmpty()) {
            message.put("reasoning_content", reasoning.toString());
        }
        addToolCalls();
        if (protocol == Protocol.MISTRAL && !reasoning.isEmpty()) {
            ArrayNode chunks = mapper.createArrayNode();
            chunks.addObject().put("type", "thinking").put("thinking", reasoning.toString());
            chunks.addObject().put("type", "text").put("text", content.toString());
            message.set("content", chunks);
            message.remove("reasoning_content");
        }

        ObjectNode choice = response.putArray("choices").addObject();
        choice.put("index", 0);
        choice.set("message", message);
        choice.set("finish_reason", response.remove("finish_reason"));
        return response;
    }

    // Chat keeps the raw text, so the existing converter still finds inline thought tags
    private String chatContentText() {
        if (protocol == Protocol.CHAT && !rawContent.isEmpty()) {
            return rawContent.toString();
        }
        return content.toString();
    }

    private ObjectNode finishCohere() {
        addToolCalls();
        message.putArray("content").addObject().put("type", "text").put("text", content.toString());
        message.put("tool_plan", reasoning.toString());
        response.set("message", message);
        return response;
    }

    private void addToolCalls() {
        if (calls.isEmpty()) {
            return;
        }
        ArrayNode toolCalls = message.putArray("tool_calls");
        calls.values().forEach(toolCalls::add);
    }

    private void mergeCall(int index, JsonNode delta) {
        ObjectNode call = calls.computeIfAbsent(index, i -> mapper.createObjectNode().put("type", "function"));
        delta.fields().forEachRemaining(field -> {
            boolean mergedSeparately = Set.of("index", "function").contains(field.getKey());
            if (!mergedSeparately && !field.getValue().isNull()) {
                call.set(field.getKey(), field.getValue());
            }
        });

        ObjectNode function = call.withObject("/function");
        JsonNode functionDelta = delta.path("function");
        if (functionDelta.hasNonNull("name")) {
            append(function, "name", functionDelta.path("name").asText());
        }
        if (functionDelta.hasNonNull("arguments")) {
            append(function, "arguments", functionDelta.path("arguments").asText());
        }
    }

    private void emit(String field, String text) {
        if (text == null || text.isEmpty()) {
            return;
        }
        if (field.equals("value")) {
            content.append(text);
        } else {
            reasoning.append(text);
        }
        listener.accept(new CompletionDelta(field, text));
    }

    private static void append(ObjectNode node, String key, String text) {
        node.put(key, node.path(key).asText("") + text);
    }

    private JsonNode readJson(String data) {
        try {
            return mapper.readTree(data);
        } catch (IOException e) {
            throw new IllegalStateException("Invalid provider stream frame", e);
        }
    }
}

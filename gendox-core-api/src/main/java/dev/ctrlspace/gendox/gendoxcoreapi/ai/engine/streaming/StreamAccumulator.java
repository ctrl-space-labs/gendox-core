package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import java.util.function.Consumer;
import static dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.ProviderStreamClient.Protocol;

/** Provider frames are accumulated into their ordinary response shape for the existing converters. */
public final class StreamAccumulator {
    private final ObjectMapper mapper;
    private final Protocol protocol;
    private final Consumer<CompletionDelta> listener;
    private final ObjectNode response;
    private final ObjectNode message;
    private final SortedMap<Integer, ObjectNode> calls = new TreeMap<>();
    private final SortedMap<Integer, ObjectNode> blocks = new TreeMap<>();
    private final Map<Integer, StringBuilder> inputs = new HashMap<>();
    private final StringBuilder rawContent = new StringBuilder();
    private final StringBuilder content = new StringBuilder();
    private final StringBuilder reasoning = new StringBuilder();
    private final InlineThoughtStream thoughts;
    private boolean ended;

    public StreamAccumulator(ObjectMapper mapper, Protocol protocol, Consumer<CompletionDelta> listener) {
        this.mapper = mapper;
        this.protocol = protocol;
        this.listener = listener;
        response = mapper.createObjectNode();
        message = mapper.createObjectNode().put("role", "assistant");
        thoughts = new InlineThoughtStream(this::emit);
    }

    public void accept(String event, String data) {
        if (data.equals("[DONE]")) { ended = true; return; }
        try {
            JsonNode node = mapper.readTree(data);
            String type = node.path("type").asText(event);
            if (type.equals("error") || node.hasNonNull("error") || type.equals("response.failed"))
                throw new IllegalStateException("Provider stream failed");
            switch (protocol) {
                case CHAT, MISTRAL -> chat(node);
                case RESPONSES -> responses(type, node);
                case ANTHROPIC -> anthropic(type, node);
                case COHERE -> cohere(type, node);
            }
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Invalid provider stream frame", e);
        }
    }

    private void chat(JsonNode node) {
        for (String key : List.of("id", "model", "object", "created"))
            if (node.has(key)) response.set(key, node.get(key));
        if (node.hasNonNull("usage")) response.set("usage", node.get("usage"));
        if (node.path("x_groq").hasNonNull("usage")) response.set("usage", node.path("x_groq").get("usage"));
        for (JsonNode choice : node.path("choices")) {
            if (choice.path("index").asInt() != 0) continue;
            JsonNode delta = choice.path("delta");
            JsonNode text = delta.get("content");
            if (text != null && text.isTextual()) { rawContent.append(text.asText()); thoughts.append(text.asText()); }
            if (text != null && text.isArray()) for (JsonNode part : text) {
                if (part.path("type").asText().equals("thinking")) {
                    JsonNode thinking = part.get("thinking");
                    if (thinking != null && thinking.isArray()) for (JsonNode inner : thinking) emit("reasoningContent", inner.path("text").asText(""));
                    else emit("reasoningContent", thinking == null ? part.path("text").asText("") : thinking.asText(""));
                } else if (part.path("type").asText().equals("text")) thoughts.append(part.path("text").asText(""));
            }
            String r = delta.path("reasoning_content").asText(delta.path("reasoning").asText(""));
            emit("reasoningContent", r);
            if (delta.hasNonNull("extra_content")) message.set("extra_content", delta.get("extra_content"));
            for (JsonNode call : delta.path("tool_calls")) mergeCall(call.path("index").asInt(), call);
            if (choice.hasNonNull("finish_reason")) response.set("finish_reason", choice.get("finish_reason"));
        }
    }

    private void responses(String type, JsonNode node) {
        if (type.equals("response.output_text.delta")) emit("value", node.path("delta").asText());
        if (type.equals("response.reasoning_summary_text.delta")) emit("reasoningContent", node.path("delta").asText());
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
            case "content_block_delta" -> {
                ObjectNode block = blocks.get(index);
                if (block == null) throw new IllegalStateException("Delta without content block");
                JsonNode delta = node.path("delta");
                switch (delta.path("type").asText()) {
                    case "text_delta" -> { append(block, "text", delta.path("text").asText()); emit("value", delta.path("text").asText()); }
                    case "thinking_delta" -> { append(block, "thinking", delta.path("thinking").asText()); emit("reasoningContent", delta.path("thinking").asText()); }
                    case "signature_delta" -> append(block, "signature", delta.path("signature").asText());
                    case "input_json_delta" -> inputs.computeIfAbsent(index, i -> new StringBuilder()).append(delta.path("partial_json").asText());
                    default -> { }
                }
            }
            case "content_block_stop" -> {
                if (inputs.containsKey(index)) {
                    try { blocks.get(index).set("input", mapper.readTree(inputs.get(index).toString())); }
                    catch (java.io.IOException e) { throw new IllegalStateException("Invalid tool arguments", e); }
                }
            }
            case "message_delta" -> {
                response.setAll((ObjectNode) node.path("delta"));
                ObjectNode usage = response.withObject("/usage");
                if (node.path("usage").isObject()) usage.setAll((ObjectNode) node.get("usage"));
            }
            case "message_stop" -> ended = true;
            default -> { }
        }
    }

    private void cohere(String type, JsonNode node) {
        JsonNode delta = node.path("delta");
        switch (type) {
            case "message-start" -> response.put("id", node.path("id").asText());
            case "content-delta" -> emit("value", delta.path("message").path("content").path("text").asText(""));
            case "tool-plan-delta" -> emit("reasoningContent", delta.path("message").path("tool_plan").asText(""));
            case "tool-call-start", "tool-call-delta" -> mergeCall(node.path("index").asInt(), delta.path("message").path("tool_calls"));
            case "message-end" -> { response.setAll((ObjectNode) delta); ended = true; }
            default -> { }
        }
    }

    private void mergeCall(int index, JsonNode delta) {
        ObjectNode call = calls.computeIfAbsent(index, i -> mapper.createObjectNode().put("type", "function"));
        delta.fields().forEachRemaining(field -> {
            if (!Set.of("index", "function").contains(field.getKey()) && !field.getValue().isNull()) call.set(field.getKey(), field.getValue());
        });
        ObjectNode fn = call.withObject("/function");
        if (delta.path("function").hasNonNull("name")) append(fn, "name", delta.path("function").path("name").asText());
        if (delta.path("function").hasNonNull("arguments")) append(fn, "arguments", delta.path("function").path("arguments").asText());
    }

    private void emit(String field, String text) {
        if (text == null || text.isEmpty()) return;
        (field.equals("value") ? content : reasoning).append(text);
        listener.accept(new CompletionDelta(field, text));
    }

    private static void append(ObjectNode node, String key, String text) { node.put(key, node.path(key).asText("") + text); }

    public ObjectNode finish() {
        thoughts.finish();
        if (!ended) throw new IllegalStateException("Provider stream ended before completion");
        if (protocol == Protocol.RESPONSES) return response;
        if (protocol == Protocol.ANTHROPIC) {
            ArrayNode array = response.putArray("content");
            blocks.values().forEach(array::add);
            return response;
        }
        message.put("content", protocol == Protocol.CHAT && !rawContent.isEmpty() ? rawContent.toString() : content.toString());
        if (!reasoning.isEmpty()) message.put("reasoning_content", reasoning.toString());
        if (!calls.isEmpty()) { ArrayNode array = message.putArray("tool_calls"); calls.values().forEach(array::add); }
        if (protocol == Protocol.COHERE) {
            message.putArray("content").addObject().put("type", "text").put("text", content.toString());
            message.put("tool_plan", reasoning.toString());
            response.set("message", message);
        } else {
            if (protocol == Protocol.MISTRAL && !reasoning.isEmpty()) {
                ArrayNode chunks = mapper.createArrayNode();
                chunks.addObject().put("type", "thinking").put("thinking", reasoning.toString());
                chunks.addObject().put("type", "text").put("text", content.toString());
                message.set("content", chunks);
                message.remove("reasoning_content");
            }
            response.putArray("choices").addObject().put("index", 0)
                    .set("message", message);
            ((ObjectNode)response.path("choices").get(0)).set("finish_reason", response.remove("finish_reason"));
        }
        return response;
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Set;

/**
 * The model writes an artifact's whole content into its create_artifact or update_artifact call, and read_artifact
 * returns it whole; the history replays both. Replayed from the thread, that content is replaced by a fixed note, so a
 * long artifact is not paid for again with every later question. The note never changes, so the history stays the
 * same from request to request and prompt caching holds. The model reads the current text with read_artifact.
 * <p>
 * A widget's content is in its show_widget call too, and nothing can read it back, so the conversation's latest
 * widget keeps its content: the agent can build on it when asked for a change. Earlier widgets get a note of their
 * own.
 */
public final class ArtifactHistory {

    static final String CONTENT_NOTE = "[Left out of the conversation history. Read the current text with read_artifact.]";

    static final String WIDGET_NOTE = "[A widget shown earlier; its content is left out of the conversation history.]";

    private static final Set<String> WRITING_TOOLS = Set.of(CreateArtifactTool.NAME, UpdateArtifactTool.NAME);

    private ArtifactHistory() {
    }

    /**
     * Replaces the {@code content} argument of every artifact-writing call in the messages, and of every show_widget
     * call but the latest; the edits of an update stay, they are small. The messages' tool calls are replaced by
     * changed copies; nothing else is touched.
     *
     * @return the same list, for chaining
     */
    public static List<AiModelMessage> withoutArtifactContent(List<AiModelMessage> messages, ObjectMapper objectMapper) {
        JsonNode latestWidget = latestWidgetCall(messages);
        for (AiModelMessage message : messages) {
            if ("tool".equals(message.getRole()) && ReadArtifactTool.NAME.equals(message.getName())) {
                message.setContent(withoutContent(message.getContent(), objectMapper));
                continue;
            }
            JsonNode toolCalls = message.getToolCalls();
            if (toolCalls == null || !toolCalls.isArray() || !hasContentToLeaveOut(toolCalls, latestWidget)) {
                continue;
            }
            ArrayNode calls = (ArrayNode) toolCalls.deepCopy();
            for (int i = 0; i < calls.size(); i++) {
                if (!(calls.get(i).get("function") instanceof ObjectNode function)) {
                    continue;
                }
                String name = function.path("name").asText();
                if (WRITING_TOOLS.contains(name)) {
                    leaveOutContent(function, CONTENT_NOTE, objectMapper);
                } else if (ShowWidgetTool.NAME.equals(name) && toolCalls.get(i) != latestWidget) {
                    leaveOutContent(function, WIDGET_NOTE, objectMapper);
                }
            }
            message.setToolCalls(calls);
        }
        return messages;
    }

    // the last show_widget call of the conversation, as it is in its message, or null
    private static JsonNode latestWidgetCall(List<AiModelMessage> messages) {
        JsonNode latest = null;
        for (AiModelMessage message : messages) {
            JsonNode toolCalls = message.getToolCalls();
            if (toolCalls == null || !toolCalls.isArray()) {
                continue;
            }
            for (JsonNode call : toolCalls) {
                if (ShowWidgetTool.NAME.equals(call.path("function").path("name").asText())) {
                    latest = call;
                }
            }
        }
        return latest;
    }

    // a read_artifact result is the JSON text of an object; an error result has no content and stays as it is
    private static String withoutContent(String result, ObjectMapper objectMapper) {
        if (result == null) {
            return null;
        }
        try {
            if (objectMapper.readTree(result) instanceof ObjectNode object && object.has("content")) {
                object.put("content", CONTENT_NOTE);
                return object.toString();
            }
        } catch (JacksonException e) {
            // not JSON: leave it
        }
        return result;
    }

    private static boolean hasContentToLeaveOut(JsonNode toolCalls, JsonNode latestWidget) {
        for (JsonNode call : toolCalls) {
            String name = call.path("function").path("name").asText();
            if (WRITING_TOOLS.contains(name) || (ShowWidgetTool.NAME.equals(name) && call != latestWidget)) {
                return true;
            }
        }
        return false;
    }

    // arguments are the JSON text of an object, as the providers send them, or an object
    private static void leaveOutContent(ObjectNode function, String note, ObjectMapper objectMapper) {
        JsonNode arguments = function.get("arguments");
        if (arguments == null) {
            return;
        }
        if (arguments instanceof ObjectNode object) {
            if (object.has("content")) {
                object.put("content", note);
            }
            return;
        }
        if (!arguments.isTextual()) {
            return;
        }
        JsonNode parsed;
        try {
            parsed = objectMapper.readTree(arguments.asText());
        } catch (JacksonException e) {
            // a call cut short by the output limit: not valid JSON, and it was answered with an error; leave it
            return;
        }
        if (parsed instanceof ObjectNode object && object.has("content")) {
            object.put("content", note);
            function.put("arguments", object.toString());
        }
    }
}
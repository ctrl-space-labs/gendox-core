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
 * The model writes an artifact's whole content into its create_artifact or update_artifact call, and the history
 * replays tool calls. Replayed from the thread, that content is replaced by a fixed note, so a long artifact is not
 * paid for again with every later question. The note never changes, so the history stays the same from request to
 * request and prompt caching holds. The model reads the current text with read_artifact.
 */
public final class ArtifactHistory {

    static final String CONTENT_NOTE = "[Left out of the conversation history. Read the current text with read_artifact.]";

    private static final Set<String> WRITING_TOOLS = Set.of(CreateArtifactTool.NAME, UpdateArtifactTool.NAME);

    private ArtifactHistory() {
    }

    /**
     * Replaces the {@code content} argument of every artifact-writing call in the messages; the edits of an update stay,
     * they are small. The messages' tool calls are replaced by changed copies; nothing else is touched.
     *
     * @return the same list, for chaining
     */
    public static List<AiModelMessage> withoutArtifactContent(List<AiModelMessage> messages, ObjectMapper objectMapper) {
        for (AiModelMessage message : messages) {
            JsonNode toolCalls = message.getToolCalls();
            if (toolCalls == null || !toolCalls.isArray() || !writesArtifact(toolCalls)) {
                continue;
            }
            ArrayNode calls = (ArrayNode) toolCalls.deepCopy();
            for (JsonNode call : calls) {
                if (call.get("function") instanceof ObjectNode function
                        && WRITING_TOOLS.contains(function.path("name").asText())) {
                    leaveOutContent(function, objectMapper);
                }
            }
            message.setToolCalls(calls);
        }
        return messages;
    }

    private static boolean writesArtifact(JsonNode toolCalls) {
        for (JsonNode call : toolCalls) {
            if (WRITING_TOOLS.contains(call.path("function").path("name").asText())) {
                return true;
            }
        }
        return false;
    }

    // arguments are the JSON text of an object, as the providers send them, or an object
    private static void leaveOutContent(ObjectNode function, ObjectMapper objectMapper) {
        JsonNode arguments = function.get("arguments");
        if (arguments == null) {
            return;
        }
        if (arguments instanceof ObjectNode object) {
            if (object.has("content")) {
                object.put("content", CONTENT_NOTE);
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
            object.put("content", CONTENT_NOTE);
            function.put("arguments", object.toString());
        }
    }
}
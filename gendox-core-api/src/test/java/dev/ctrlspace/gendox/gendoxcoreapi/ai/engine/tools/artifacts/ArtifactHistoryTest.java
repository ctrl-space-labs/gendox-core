package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactHistoryTest {

    private final ObjectMapper objectMapper = JsonMapper.shared();

    private AiModelMessage assistantCalling(String toolCallsJson) {
        return AiModelMessage.builder().role("assistant").toolCalls(objectMapper.readTree(toolCallsJson)).build();
    }

    private JsonNode argumentsOf(AiModelMessage message, int call) {
        JsonNode arguments = message.getToolCalls().get(call).get("function").get("arguments");
        return arguments.isTextual() ? objectMapper.readTree(arguments.asText()) : arguments;
    }

    @Test
    void theContentOfCreateAndUpdateIsLeftOutAndTheRestStays() {
        AiModelMessage message = assistantCalling("""
                [{"id":"c1","type":"function","function":{"name":"create_artifact",
                  "arguments":"{\\"title\\":\\"Card\\",\\"kind\\":\\"html\\",\\"content\\":\\"<h1>long</h1>\\"}"}},
                 {"id":"c2","type":"function","function":{"name":"update_artifact",
                  "arguments":"{\\"artifact_id\\":\\"a1\\",\\"content\\":\\"<h1>rewritten</h1>\\"}"}}]
                """);

        ArtifactHistory.withoutArtifactContent(List.of(message), objectMapper);

        JsonNode created = argumentsOf(message, 0);
        assertEquals(ArtifactHistory.CONTENT_NOTE, created.get("content").asText());
        assertEquals("Card", created.get("title").asText());
        assertEquals("html", created.get("kind").asText());
        assertEquals(ArtifactHistory.CONTENT_NOTE, argumentsOf(message, 1).get("content").asText());
        assertEquals("a1", argumentsOf(message, 1).get("artifact_id").asText());
        assertEquals("c1", message.getToolCalls().get(0).get("id").asText());
    }

    @Test
    void editsStay() {
        AiModelMessage message = assistantCalling("""
                [{"id":"c1","type":"function","function":{"name":"update_artifact",
                  "arguments":"{\\"artifact_id\\":\\"a1\\",\\"edits\\":[{\\"old_text\\":\\"Old\\",\\"new_text\\":\\"New\\"}]}"}}]
                """);

        ArtifactHistory.withoutArtifactContent(List.of(message), objectMapper);

        JsonNode arguments = argumentsOf(message, 0);
        assertFalse(arguments.has("content"));
        assertEquals("Old", arguments.get("edits").get(0).get("old_text").asText());
    }

    @Test
    void otherToolsAndPlainMessagesAreNotTouched() {
        String otherCall = """
                [{"id":"c1","type":"function","function":{"name":"advanced_search","arguments":"{\\"content\\":\\"keep\\"}"}}]
                """;
        AiModelMessage search = assistantCalling(otherCall);
        JsonNode before = search.getToolCalls();
        AiModelMessage answer = AiModelMessage.builder().role("assistant").content("An answer").build();

        ArtifactHistory.withoutArtifactContent(List.of(search, answer), objectMapper);

        assertSame(before, search.getToolCalls());
        assertEquals("keep", argumentsOf(search, 0).get("content").asText());
        assertNull(answer.getToolCalls());
        assertEquals("An answer", answer.getContent());
    }

    @Test
    void theNoteIsTheSameEveryTimeSoTheHistoryStaysCacheable() {
        String call = """
                [{"id":"c1","type":"function","function":{"name":"create_artifact",
                  "arguments":"{\\"title\\":\\"Card\\",\\"kind\\":\\"html\\",\\"content\\":\\"<h1>long</h1>\\"}"}}]
                """;
        AiModelMessage first = assistantCalling(call);
        AiModelMessage second = assistantCalling(call);

        ArtifactHistory.withoutArtifactContent(List.of(first), objectMapper);
        ArtifactHistory.withoutArtifactContent(List.of(second), objectMapper);

        assertEquals(first.getToolCalls().toString(), second.getToolCalls().toString());
    }

    @Test
    void aCallCutShortIsLeftAsItIs() {
        AiModelMessage message = assistantCalling("""
                [{"id":"c1","type":"function","function":{"name":"create_artifact","arguments":"{\\"title\\":\\"Card\\",\\"content\\":\\"<h1>lo"}}]
                """);

        ArtifactHistory.withoutArtifactContent(List.of(message), objectMapper);

        assertEquals("{\"title\":\"Card\",\"content\":\"<h1>lo",
                message.getToolCalls().get(0).get("function").get("arguments").asText());
    }
}
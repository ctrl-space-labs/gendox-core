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
    void theLatestWidgetKeepsItsContentAndEarlierOnesGetTheirNote() {
        AiModelMessage first = assistantCalling("""
                [{"id":"w1","type":"function","function":{"name":"show_widget",
                  "arguments":"{\\"title\\":\\"Converter\\",\\"kind\\":\\"html\\",\\"content\\":\\"<p>v1</p>\\"}"}}]
                """);
        AiModelMessage second = assistantCalling("""
                [{"id":"w2","type":"function","function":{"name":"show_widget",
                  "arguments":"{\\"title\\":\\"Converter\\",\\"kind\\":\\"html\\",\\"content\\":\\"<p>v2</p>\\"}"}}]
                """);

        ArtifactHistory.withoutArtifactContent(List.of(first, second), objectMapper);

        assertEquals(ArtifactHistory.WIDGET_NOTE, argumentsOf(first, 0).get("content").asText());
        assertEquals("Converter", argumentsOf(first, 0).get("title").asText());
        assertEquals("<p>v2</p>", argumentsOf(second, 0).get("content").asText());
    }

    @Test
    void aWidgetAfterAnArtifactInTheSameMessageKeepsItsContent() {
        AiModelMessage message = assistantCalling("""
                [{"id":"c1","type":"function","function":{"name":"create_artifact",
                  "arguments":"{\\"title\\":\\"Report\\",\\"kind\\":\\"html\\",\\"content\\":\\"<h1>long</h1>\\"}"}},
                 {"id":"w1","type":"function","function":{"name":"show_widget",
                  "arguments":"{\\"title\\":\\"Chart\\",\\"kind\\":\\"svg\\",\\"content\\":\\"<svg/>\\"}"}}]
                """);

        ArtifactHistory.withoutArtifactContent(List.of(message), objectMapper);

        assertEquals(ArtifactHistory.CONTENT_NOTE, argumentsOf(message, 0).get("content").asText());
        assertEquals("<svg/>", argumentsOf(message, 1).get("content").asText());
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

    private AiModelMessage toolResult(String name, String content) {
        return AiModelMessage.builder().role("tool").name(name).toolCallId("c1").content(content).build();
    }

    @Test
    void theContentReadArtifactReturnedIsLeftOutAndTheRestStays() {
        AiModelMessage read = toolResult("read_artifact", """
                {"artifactId":"a1","title":"Card","kind":"html","version":2,"latestVersion":3,"content":"<h1>long</h1>"}""");

        ArtifactHistory.withoutArtifactContent(List.of(read), objectMapper);

        JsonNode result = objectMapper.readTree(read.getContent());
        assertEquals(ArtifactHistory.CONTENT_NOTE, result.get("content").asText());
        assertEquals("a1", result.get("artifactId").asText());
        assertEquals(2, result.get("version").asInt());
        assertEquals(3, result.get("latestVersion").asInt());
        assertEquals("c1", read.getToolCallId());
    }

    @Test
    void aReadThatFailedAndOtherToolsResultsAreNotTouched() {
        String failed = "{\"errorCode\":\"ARTIFACT_NOT_FOUND\",\"errorMessage\":\"No artifact a1\"}";
        AiModelMessage error = toolResult("read_artifact", failed);
        AiModelMessage notJson = toolResult("read_artifact", "not json");
        AiModelMessage search = toolResult("advanced_search", "{\"content\":\"keep\"}");

        ArtifactHistory.withoutArtifactContent(List.of(error, notJson, search), objectMapper);

        assertEquals(failed, error.getContent());
        assertEquals("not json", notJson.getContent());
        assertEquals("{\"content\":\"keep\"}", search.getContent());
    }

    @Test
    void aReadIsTheSameEveryTimeSoTheHistoryStaysCacheable() {
        String result = "{\"artifactId\":\"a1\",\"version\":1,\"content\":\"<h1>long</h1>\"}";
        AiModelMessage first = toolResult("read_artifact", result);
        AiModelMessage second = toolResult("read_artifact", result);

        ArtifactHistory.withoutArtifactContent(List.of(first), objectMapper);
        ArtifactHistory.withoutArtifactContent(List.of(second), objectMapper);

        assertEquals(first.getContent(), second.getContent());
    }
}

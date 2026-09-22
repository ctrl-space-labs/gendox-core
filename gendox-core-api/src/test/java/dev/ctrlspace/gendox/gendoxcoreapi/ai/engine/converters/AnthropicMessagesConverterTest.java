package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicContentBlock;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnthropicMessagesConverterTest {

    private ObjectMapper objectMapper;
    private AnthropicMessagesConverter converter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        converter = new AnthropicMessagesConverter(objectMapper);
    }

    @Test
    void mapMessages_extractsSystemAndBatchesToolResults() throws Exception {
        JsonNode toolCalls = objectMapper.readTree("""
                [{"id":"toolu_01","type":"function","function":{"name":"search","arguments":"{\\"q\\":\\"x\\"}"}}]
                """);

        List<AiModelMessage> messages = new ArrayList<>();
        messages.add(AiModelMessage.builder().role("system").content("You are helpful.").build());
        messages.add(AiModelMessage.builder().role("user").content("Hello").build());
        messages.add(AiModelMessage.builder().role("assistant").content("Calling tool").toolCalls(toolCalls).build());
        messages.add(AiModelMessage.builder().role("tool").toolCallId("toolu_01").name("search").content("{\"hits\":[]}").build());

        AnthropicMessagesConverter.MappedAnthropicMessages mapped = converter.mapMessages(messages);

        assertEquals("You are helpful.", mapped.system());
        List<AnthropicCompletionRequest.Message> out = mapped.messages();
        assertEquals(3, out.size());

        assertEquals("user", out.get(0).getRole());
        assertEquals(List.of(new AnthropicContentBlock.Text("Hello")), out.get(0).getContent());

        assertEquals("assistant", out.get(1).getRole());
        List<AnthropicContentBlock> blocks = out.get(1).getContent();
        assertEquals(2, blocks.size());
        assertEquals(new AnthropicContentBlock.Text("Calling tool"), blocks.get(0));
        AnthropicContentBlock.ToolUse toolUse = assertInstanceOf(AnthropicContentBlock.ToolUse.class, blocks.get(1));
        assertEquals("toolu_01", toolUse.id());
        assertEquals("search", toolUse.name());
        assertEquals("x", toolUse.input().get("q").asText());

        assertEquals("user", out.get(2).getRole());
        assertEquals(List.of(new AnthropicContentBlock.ToolResult("toolu_01", "{\"hits\":[]}")),
                out.get(2).getContent());

        // tool batch → single user message, tool_result blocks first
        AnthropicMessagesConverter.MappedAnthropicMessages mapped2 = converter.mapMessages(List.of(
                AiModelMessage.builder().role("assistant").toolCalls(toolCalls).build(),
                AiModelMessage.builder().role("tool").toolCallId("toolu_01").name("search").content("result-a").build(),
                AiModelMessage.builder().role("tool").toolCallId("toolu_02").name("other").content("result-b").build()
        ));
        assertEquals(2, mapped2.messages().size());
        assertEquals("assistant", mapped2.messages().get(0).getRole());
        assertEquals(List.of(new AnthropicContentBlock.ToolResult("toolu_01", "result-a"),
                        new AnthropicContentBlock.ToolResult("toolu_02", "result-b")),
                mapped2.messages().get(1).getContent());
    }

    @Test
    void mapMessages_replaysStoredThinkingBlocksBeforeTextAndToolUse() throws Exception {
        // Exactly what AnthropicCompletionResponseConverter writes into reasoning_metadata.
        JsonNode storedThinking = objectMapper.readTree(
                "[{\"type\":\"thinking\",\"thinking\":\"Let me check.\",\"signature\":\"sig-abc\"},"
                        + "{\"type\":\"redacted_thinking\",\"data\":\"enc-xyz\"}]");
        JsonNode toolCalls = objectMapper.readTree(
                "[{\"id\":\"toolu_09\",\"type\":\"function\",\"function\":{\"name\":\"search\",\"arguments\":\"{}\"}}]");

        AnthropicMessagesConverter.MappedAnthropicMessages mapped = converter.mapMessages(List.of(
                AiModelMessage.builder().role("assistant").content("Answer")
                        .reasoningMetadata(storedThinking).toolCalls(toolCalls).build()));

        List<AnthropicContentBlock> blocks = mapped.messages().getFirst().getContent();
        assertEquals(4, blocks.size());
        // Anthropic rejects the turn unless thinking comes first.
        assertEquals(new AnthropicContentBlock.Thinking("Let me check.", "sig-abc"), blocks.get(0));
        assertEquals(new AnthropicContentBlock.RedactedThinking("enc-xyz"), blocks.get(1));
        assertEquals(new AnthropicContentBlock.Text("Answer"), blocks.get(2));
        assertInstanceOf(AnthropicContentBlock.ToolUse.class, blocks.get(3));

        // The signature must survive serialization untouched or replay fails.
        JsonNode wire = objectMapper.valueToTree(blocks);
        assertEquals("thinking", wire.get(0).get("type").asText());
        assertEquals("sig-abc", wire.get(0).get("signature").asText());
        assertEquals("redacted_thinking", wire.get(1).get("type").asText());
        assertEquals("enc-xyz", wire.get(1).get("data").asText());
    }

    @Test
    void toAnthropicToolDefinition_mapsParametersToInputSchema() {
        AiTools tool = AiTools.builder()
                .type("function")
                .jsonSchema("""
                        {"name":"get_weather","description":"Weather","parameters":{"type":"object","properties":{"loc":{"type":"string"}}}}
                        """)
                .build();

        AnthropicCompletionRequest.ToolDefinition def = converter.toAnthropicToolDefinition(tool);
        assertEquals("get_weather", def.getName());
        assertEquals("Weather", def.getDescription());
        assertEquals("object", def.getInputSchema().get("type").asText());
        assertTrue(def.getInputSchema().has("properties"));
    }

    @Test
    void mapToolChoice_mapsRequiredToAny() {
        assertEquals("auto", converter.mapToolChoice(null).get("type").asText());
        assertEquals("auto", converter.mapToolChoice("auto").get("type").asText());
        assertEquals("any", converter.mapToolChoice("required").get("type").asText());
        assertEquals("none", converter.mapToolChoice("none").get("type").asText());
    }
}

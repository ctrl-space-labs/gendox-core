package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicCompletionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
        assertTrue(out.get(0).getContent().isTextual());
        assertEquals("Hello", out.get(0).getContent().asText());

        assertEquals("assistant", out.get(1).getRole());
        assertTrue(out.get(1).getContent().isArray());
        JsonNode blocks = out.get(1).getContent();
        assertEquals(2, blocks.size());
        assertEquals("text", blocks.get(0).get("type").asText());
        assertEquals("Calling tool", blocks.get(0).get("text").asText());
        assertEquals("tool_use", blocks.get(1).get("type").asText());
        assertEquals("toolu_01", blocks.get(1).get("id").asText());
        assertEquals("search", blocks.get(1).get("name").asText());
        assertEquals("x", blocks.get(1).get("input").get("q").asText());

        assertEquals("user", out.get(2).getRole());
        JsonNode toolResults = out.get(2).getContent();
        assertTrue(toolResults.isArray());
        assertEquals(1, toolResults.size());
        assertEquals("tool_result", toolResults.get(0).get("type").asText());
        assertEquals("toolu_01", toolResults.get(0).get("tool_use_id").asText());

        // tool batch → single user message, tool_result blocks first
        AnthropicMessagesConverter.MappedAnthropicMessages mapped2 = converter.mapMessages(List.of(
                AiModelMessage.builder().role("assistant").toolCalls(toolCalls).build(),
                AiModelMessage.builder().role("tool").toolCallId("toolu_01").name("search").content("result-a").build(),
                AiModelMessage.builder().role("tool").toolCallId("toolu_02").name("other").content("result-b").build()
        ));
        assertEquals(2, mapped2.messages().size());
        assertEquals("assistant", mapped2.messages().get(0).getRole());
        JsonNode toolUserContent = mapped2.messages().get(1).getContent();
        assertTrue(toolUserContent.isArray());
        assertEquals(2, toolUserContent.size());
        assertEquals("tool_result", toolUserContent.get(0).get("type").asText());
        assertEquals("toolu_01", toolUserContent.get(0).get("tool_use_id").asText());
        assertEquals("tool_result", toolUserContent.get(1).get("type").asText());
        assertEquals("toolu_02", toolUserContent.get(1).get("tool_use_id").asText());
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

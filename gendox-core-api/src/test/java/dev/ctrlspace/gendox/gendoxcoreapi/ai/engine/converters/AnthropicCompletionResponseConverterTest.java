package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AnthropicCompletionResponseConverterTest {

    private AnthropicCompletionResponseConverter converter;

    @BeforeEach
    void setUp() {
        converter = new AnthropicCompletionResponseConverter(new ObjectMapper());
    }

    @Test
    void toCompletionResponse_singleChoice_mergesTextAndMapsToolUseToOpenAiShape() throws Exception {
        ObjectMapper om = new ObjectMapper();
        JsonNode inputNode = om.readTree("{\"a\":1}");

        AnthropicCompletionResponse response = AnthropicCompletionResponse.builder()
                .id("msg_1")
                .model("claude-3-5-sonnet-20241022")
                .role("assistant")
                .stop_reason("tool_use")
                .content(List.of(
                        AnthropicCompletionResponse.Content.builder()
                                .type("text")
                                .text("I will use a tool.")
                                .build(),
                        AnthropicCompletionResponse.Content.builder()
                                .type("tool_use")
                                .id("toolu_xyz")
                                .name("my_tool")
                                .input(inputNode)
                                .build()
                ))
                .usage(AnthropicCompletionResponse.Usage.builder()
                        .input_tokens(10)
                        .output_tokens(20)
                        .build())
                .build();

        CompletionResponse cr = converter.toCompletionResponse(response);

        assertEquals(1, cr.getChoices().size());
        Choice choice = cr.getChoices().getFirst();
        assertEquals(0, choice.getIndex());
        assertEquals("tool_calls", choice.getFinishReason());
        assertEquals("assistant", choice.getMessage().getRole());
        assertEquals("I will use a tool.", choice.getMessage().getContent());

        JsonNode toolCalls = choice.getMessage().getToolCalls();
        assertNotNull(toolCalls);
        assertTrue(toolCalls.isArray());
        assertEquals(1, toolCalls.size());
        JsonNode call = toolCalls.get(0);
        assertEquals("toolu_xyz", call.get("id").asText());
        assertEquals("function", call.get("type").asText());
        assertEquals("my_tool", call.get("function").get("name").asText());
        assertTrue(call.get("function").get("arguments").isTextual());
        assertEquals("{\"a\":1}", call.get("function").get("arguments").asText());
    }

    @Test
    void toCompletionResponse_endTurn_mapsToStop() {
        AnthropicCompletionResponse response = AnthropicCompletionResponse.builder()
                .id("msg_2")
                .model("claude")
                .role("assistant")
                .stop_reason("end_turn")
                .content(List.of(
                        AnthropicCompletionResponse.Content.builder()
                                .type("text")
                                .text("Done.")
                                .build()
                ))
                .usage(AnthropicCompletionResponse.Usage.builder().input_tokens(1).output_tokens(2).build())
                .build();

        CompletionResponse cr = converter.toCompletionResponse(response);
        assertEquals("stop", cr.getChoices().getFirst().getFinishReason());
        assertNull(cr.getChoices().getFirst().getMessage().getToolCalls());
    }
}

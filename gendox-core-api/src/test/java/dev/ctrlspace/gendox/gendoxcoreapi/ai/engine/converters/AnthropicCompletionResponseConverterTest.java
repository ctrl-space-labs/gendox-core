package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.response.AnthropicCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
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

    @Test
    void toCompletionResponse_deserializesAnthropicUsageAndMapsCacheToPromptTokensDetail() throws Exception {
        String json = """
                {
                  "id": "msg_01DRyiG99zxzwK2g32V4pg34",
                  "type": "message",
                  "role": "assistant",
                  "model": "claude-haiku-4-5-20251001",
                  "content": [{"type": "text", "text": "hi"}],
                  "stop_reason": "end_turn",
                  "usage": {
                    "input_tokens": 8817,
                    "cache_creation_input_tokens": 100,
                    "cache_read_input_tokens": 200,
                    "cache_creation": {"ephemeral_5m_input_tokens": 80, "ephemeral_1h_input_tokens": 20},
                    "output_tokens": 162,
                    "service_tier": "standard",
                    "inference_geo": "not_available"
                  }
                }
                """;

        ObjectMapper om = new ObjectMapper();
        AnthropicCompletionResponse response = om.readValue(json, AnthropicCompletionResponse.class);
        CompletionResponse cr = converter.toCompletionResponse(response);

        Usage u = cr.getUsage();
        // OpenAI-shaped prompt_tokens = total input; Anthropic splits across input + cache read + cache create
        assertEquals(9117, u.getPromptTokens());
        assertEquals(9279, u.getTotalTokens());
        assertNotNull(u.getPromptTokensDetail());
        assertEquals(200, u.getPromptTokensDetail().getCachedTokens());
        assertEquals(100, u.getPromptTokensDetail().getCacheCreationInputTokens());
        assertNotNull(u.getPromptTokensDetail().getCacheCreation());
        assertEquals(80, u.getPromptTokensDetail().getCacheCreation().getEphemeral5mInputTokens());
        assertEquals(20, u.getPromptTokensDetail().getCacheCreation().getEphemeral1hInputTokens());
    }

    @Test
    void toCompletionResponse_cacheHit_sumsPromptTokensLikeOpenAI() throws Exception {
        String json = """
                {
                  "model": "claude-haiku-4-5-20251001",
                  "id": "msg_015CsNNiEDUBpXgxR9Z1vgfS",
                  "type": "message",
                  "role": "assistant",
                  "content": [],
                  "stop_reason": "tool_use",
                  "usage": {
                    "input_tokens": 3,
                    "cache_creation_input_tokens": 0,
                    "cache_read_input_tokens": 8351,
                    "cache_creation": {
                      "ephemeral_5m_input_tokens": 0,
                      "ephemeral_1h_input_tokens": 0
                    },
                    "output_tokens": 172,
                    "service_tier": "standard",
                    "inference_geo": "not_available"
                  }
                }
                """;

        ObjectMapper om = new ObjectMapper();
        AnthropicCompletionResponse response = om.readValue(json, AnthropicCompletionResponse.class);
        Usage u = converter.toCompletionResponse(response).getUsage();

        assertEquals(8354, u.getPromptTokens());
        assertEquals(8526, u.getTotalTokens());
        assertNotNull(u.getPromptTokensDetail());
        assertEquals(8351, u.getPromptTokensDetail().getCachedTokens());
    }
}

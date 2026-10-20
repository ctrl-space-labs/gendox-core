package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** Cohere and Mistral tool calls reach the tool loop in OpenAI's shape, as the other providers' do. */
class ToolCallResponseConvertersTest {

    final ObjectMapper mapper = new ObjectMapper();

    @Test
    void mistralCallsKeepTheirArgumentsAsJsonText() throws Exception {
        // Arguments come as an object from the JSON API and as text from a stream
        MistralCompletionResponse response = mapper.readValue("""
                {"id":"r","usage":{"prompt_tokens":1,"completion_tokens":1,"total_tokens":2},
                 "choices":[{"index":0,"finish_reason":"tool_calls","message":{"role":"assistant","content":"",
                   "tool_calls":[{"id":"a","function":{"name":"advanced_search","arguments":{"search_query":"x"}}},
                                 {"id":"b","function":{"name":"lookup","arguments":"{\\"id\\":1}"}}]}}]}
                """, MistralCompletionResponse.class);

        CompletionResponse converted = new MistralCompletionResponseConverter().toCompletionResponse(response);

        AiModelMessage message = converted.getChoices().get(0).getMessage();
        assertEquals("tool_calls", converted.getChoices().get(0).getFinishReason());
        assertEquals("advanced_search", message.getToolCalls().get(0).path("function").path("name").asText());
        assertEquals("{\"search_query\":\"x\"}", message.getToolCalls().get(0).path("function").path("arguments").asText());
        assertEquals("{\"id\":1}", message.getToolCalls().get(1).path("function").path("arguments").asText());
        assertEquals("function", message.getToolCalls().get(1).path("type").asText());
    }

    @Test
    void aCohereToolCallHasNoTextAndKeepsItsPlan() throws Exception {
        CohereCompletionResponse response = mapper.readValue("""
                {"id":"r","finish_reason":"TOOL_CALL",
                 "usage":{"billed_units":{"input_tokens":1,"output_tokens":1}},
                 "message":{"role":"assistant","tool_plan":"I will search",
                   "tool_calls":[{"id":"a","type":"function","function":{"name":"advanced_search","arguments":"{}"}}]}}
                """, CohereCompletionResponse.class);

        CompletionResponse converted = new CohereCompletionResponseConverter().toCompletionResponse(response);

        AiModelMessage message = converted.getChoices().get(0).getMessage();
        assertEquals("tool_calls", converted.getChoices().get(0).getFinishReason());
        assertEquals("", message.getContent());
        assertEquals("I will search", message.getReasoningContent());
        assertEquals("a", message.getToolCalls().get(0).path("id").asText());
    }

    @Test
    void aCohereAnswerKeepsItsFinishReason() throws Exception {
        CohereCompletionResponse response = mapper.readValue("""
                {"id":"r","finish_reason":"COMPLETE",
                 "usage":{"billed_units":{"input_tokens":1,"output_tokens":1}},
                 "message":{"role":"assistant","content":[{"type":"text","text":"Hello"},{"type":"text","text":" there"}]}}
                """, CohereCompletionResponse.class);

        CompletionResponse converted = new CohereCompletionResponseConverter().toCompletionResponse(response);

        assertEquals("COMPLETE", converted.getChoices().get(0).getFinishReason());
        assertEquals("Hello there", converted.getChoices().get(0).getMessage().getContent());
    }
}

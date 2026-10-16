package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response.CohereCompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralCompletionResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ProviderStreamHttpTest {
    final ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    @Test void usesExistingHttpClientAndHeadersAndProducesTypedResponse() {
        RestTemplate client = new RestTemplate(); var server = MockRestServiceServer.bindTo(client).build();
        server.expect(requestTo("https://provider.invalid/chat")).andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(header("Accept", "text/event-stream"))
                .andExpect(jsonPath("$.stream").value(true))
                .andExpect(jsonPath("$.stream_options.include_usage").value(true))
                .andRespond(withSuccess("""
                  data: {"id":"x","choices":[{"index":0,"delta":{"content":"answer"},"finish_reason":"stop"}]}

                  data: {"choices":[],"usage":{"prompt_tokens":2,"completion_tokens":1,"total_tokens":3}}

                  data: [DONE]

                  """, MediaType.TEXT_EVENT_STREAM));
        HttpHeaders headers = new HttpHeaders(); headers.setContentType(MediaType.APPLICATION_JSON); headers.setBearerAuth("test-key");
        var deltas = new ArrayList<CompletionDelta>();
        var response = ProviderStreamClient.complete(client, mapper, "https://provider.invalid/chat", headers,
                Map.of("messages", List.of(), "model", "test"), ProviderStreamClient.Protocol.CHAT,
                dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiCompletionResponse.class, deltas::add);
        assertEquals("answer", response.getChoices().getFirst().getMessage().getContent());
        assertEquals(3, response.getUsage().getTotalTokens());
        assertEquals(List.of(new CompletionDelta("value", "answer")), deltas);
        server.verify();
    }
    @Test void cohereToolOnlyReplyRetainsArgumentsAndUsage() throws Exception {
        var response = mapper.readValue("""
          {"id":"x","finish_reason":"TOOL_CALL","message":{"role":"assistant","tool_plan":"look it up","tool_calls":[{"id":"a","type":"function","function":{"name":"advanced_search","arguments":"{}"}}]},"usage":{"billed_units":{"input_tokens":2,"output_tokens":3}}}
          """, CohereCompletionResponse.class);
        var result = new CohereCompletionResponseConverter().toCompletionResponse(response);
        assertEquals("tool_calls", result.getChoices().getFirst().getFinishReason());
        assertEquals("look it up", result.getChoices().getFirst().getMessage().getReasoningContent());
        assertEquals("{}", result.getChoices().getFirst().getMessage().getToolCalls().get(0).path("function").path("arguments").asText());
        assertEquals(5, result.getUsage().getTotalTokens());
    }
    @Test void mistralToolOnlyReplyMapsToExistingLoopFinishReason() throws Exception {
        var response = mapper.readValue("""
          {"id":"x","choices":[{"index":0,"finish_reason":"tool_calls","message":{"role":"assistant","content":[{"type":"thinking","thinking":[{"type":"text","text":"reason"}]}],"tool_calls":[{"id":"a","type":"function","function":{"name":"advanced_search","arguments":"{}"}}]}}],"usage":{"prompt_tokens":2,"completion_tokens":3,"total_tokens":5}}
          """, MistralCompletionResponse.class);
        var result = new MistralCompletionResponseConverter().toCompletionResponse(response);
        assertEquals("tool_calls", result.getChoices().getFirst().getFinishReason());
        assertEquals("reason", result.getChoices().getFirst().getMessage().getReasoningContent());
        assertEquals("{}", result.getChoices().getFirst().getMessage().getToolCalls().get(0).path("function").path("arguments").asText());
    }
}

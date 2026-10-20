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
}

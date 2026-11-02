package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.junit.jupiter.api.Test;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.ProviderStreamClient.Protocol;

class ProviderStreamTest {
    private final ObjectMapper mapper = new ObjectMapper();
    @Test void readsMultilineCrLfCommentsAndSplitUtf8() throws Exception {
        byte[] bytes = ": ping\r\nevent: delta\r\ndata: hello\r\ndata: κόσμε\r\n\r\nevent: done\ndata: eof".getBytes(StandardCharsets.UTF_8);
        InputStream fragmented = new FilterInputStream(new ByteArrayInputStream(bytes)) {
            @Override public int read(byte[] b, int offset, int length) throws IOException { return super.read(b, offset, Math.min(1, length)); }
        };
        List<String> frames = new ArrayList<>();
        SseReader.read(fragmented, (event, data) -> frames.add(event + ":" + data));
        assertEquals(List.of("delta:hello\nκόσμε", "done:eof"), frames);
    }
    @Test void separatesInlineThoughtTagsAcrossEveryCharacter() {
        List<CompletionDelta> deltas = new ArrayList<>();
        var parser = new InlineThoughtStream((field, text) -> deltas.add(new CompletionDelta(field, text)));
        "<thought>reason</thought>answer<thought>next</thought>tail".chars().forEach(c -> parser.append(Character.toString(c)));
        parser.finish();
        assertEquals("reas on".replace(" ", "") + "next", join(deltas, "reasoningContent"));
        assertEquals("answertail", join(deltas, "value"));
    }
    @Test void chatAssemblesParallelCallsAndRetainsSignaturesAndUsage() {
        var deltas = new ArrayList<CompletionDelta>(); var stream = new StreamAccumulator(mapper, Protocol.CHAT, deltas::add);
        stream.accept("message", """
          {"id":"x","choices":[{"index":0,"delta":{"content":"Hi","reasoning_content":"thinking","tool_calls":[{"index":1,"id":"b","function":{"name":"lookup","arguments":"{"}},{"index":0,"id":"a","extra_content":{"google":{"thought_signature":"signed"}},"function":{"name":"search","arguments":"{}"}}]}}]}
          """);
        stream.accept("message", """
          {"choices":[{"index":0,"delta":{"tool_calls":[{"index":1,"function":{"arguments":"}"}}]},"finish_reason":"tool_calls"}]}
          """);
        stream.accept("message", "{\"choices\":[],\"usage\":{\"prompt_tokens\":12,\"completion_tokens\":5,\"total_tokens\":17}}");
        stream.accept("message", "[DONE]");
        JsonNode result = stream.finish(); JsonNode message = result.path("choices").get(0).path("message");
        assertEquals("Hi", message.path("content").asText());
        assertEquals("thinking", message.path("reasoning_content").asText());
        assertEquals("a", message.path("tool_calls").get(0).path("id").asText());
        assertEquals("signed", message.path("tool_calls").get(0).path("extra_content").path("google").path("thought_signature").asText());
        assertEquals("{}", message.path("tool_calls").get(1).path("function").path("arguments").asText());
        assertEquals(17, result.path("usage").path("total_tokens").asInt());
        assertEquals("Hi", join(deltas, "value"));
    }
    @Test void responsesUsesAuthoritativeTerminalResponse() {
        var deltas = new ArrayList<CompletionDelta>(); var stream = new StreamAccumulator(mapper, Protocol.RESPONSES, deltas::add);
        stream.accept("message", "{\"type\":\"response.output_text.delta\",\"delta\":\"answer\"}");
        stream.accept("message", "{\"type\":\"response.reasoning_summary_text.delta\",\"delta\":\"summary\"}");
        stream.accept("message", "{\"type\":\"response.completed\",\"response\":{\"id\":\"r\",\"output\":[{\"type\":\"reasoning\",\"encrypted_content\":\"opaque\"}],\"usage\":{\"input_tokens\":2}}}");
        assertEquals("opaque", stream.finish().path("output").get(0).path("encrypted_content").asText());
        assertEquals("summary", join(deltas, "reasoningContent"));
    }
    @Test void anthropicAssemblesBlocksSignaturesAndCumulativeUsage() {
        var stream = new StreamAccumulator(mapper, Protocol.ANTHROPIC, d -> {});
        stream.accept("message_start", "{\"message\":{\"id\":\"a\",\"role\":\"assistant\",\"usage\":{\"input_tokens\":10,\"cache_read_input_tokens\":20}}}");
        stream.accept("content_block_start", "{\"index\":0,\"content_block\":{\"type\":\"thinking\",\"thinking\":\"\",\"signature\":\"\"}}");
        stream.accept("content_block_delta", "{\"index\":0,\"delta\":{\"type\":\"thinking_delta\",\"thinking\":\"reason\"}}");
        stream.accept("content_block_delta", "{\"index\":0,\"delta\":{\"type\":\"signature_delta\",\"signature\":\"sig\"}}");
        stream.accept("content_block_start", "{\"index\":1,\"content_block\":{\"type\":\"tool_use\",\"id\":\"t\",\"name\":\"lookup\",\"input\":{}}}");
        stream.accept("content_block_delta", "{\"index\":1,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"q\\\":1}\"}}");
        stream.accept("content_block_stop", "{\"index\":1}");
        stream.accept("message_delta", "{\"delta\":{\"stop_reason\":\"tool_use\"},\"usage\":{\"output_tokens\":7}}");
        stream.accept("message_stop", "{}");
        JsonNode result = stream.finish();
        assertEquals("sig", result.path("content").get(0).path("signature").asText());
        assertEquals(1, result.path("content").get(1).path("input").path("q").asInt());
        assertEquals(20, result.path("usage").path("cache_read_input_tokens").asInt());
        assertEquals(7, result.path("usage").path("output_tokens").asInt());
    }
    @Test void cohereMapsToolFramesAndBilledUsage() {
        var stream = new StreamAccumulator(mapper, Protocol.COHERE, d -> {});
        stream.accept("tool-call-start", "{\"index\":0,\"delta\":{\"message\":{\"tool_calls\":{\"id\":\"x\",\"function\":{\"name\":\"search\",\"arguments\":\"{\"}}}}}");
        stream.accept("tool-call-delta", "{\"index\":0,\"delta\":{\"message\":{\"tool_calls\":{\"function\":{\"arguments\":\"}\"}}}}}");
        stream.accept("message-end", "{\"delta\":{\"finish_reason\":\"TOOL_CALL\",\"usage\":{\"billed_units\":{\"input_tokens\":2,\"output_tokens\":3}}}}");
        JsonNode result = stream.finish();
        assertEquals("{}", result.path("message").path("tool_calls").get(0).path("function").path("arguments").asText());
        assertEquals(3, result.path("usage").path("billed_units").path("output_tokens").asInt());
    }
    @Test void mistralThinkingArrayTransitionsToText() {
        var stream = new StreamAccumulator(mapper, Protocol.MISTRAL, d -> {});
        stream.accept("message", "{\"choices\":[{\"delta\":{\"content\":[{\"type\":\"thinking\",\"thinking\":[{\"type\":\"text\",\"text\":\"reason\"}]}]}}]}");
        stream.accept("message", "{\"choices\":[{\"delta\":{\"content\":\"answer\"},\"finish_reason\":\"stop\"}]}");
        stream.accept("message", "[DONE]");
        JsonNode content = stream.finish().path("choices").get(0).path("message").path("content");
        assertEquals("reason", content.get(0).path("thinking").asText());
        assertEquals("answer", content.get(1).path("text").asText());
    }
    @Test void rejectsTruncatedAndErrorStreams() {
        var truncated = new StreamAccumulator(mapper, Protocol.CHAT, d -> {});
        truncated.accept("message", "{\"choices\":[{\"delta\":{\"content\":\"partial\"}}]}");
        assertThrows(IllegalStateException.class, truncated::finish);
        assertThrows(IllegalStateException.class, () -> truncated.accept("error", "{\"error\":{\"message\":\"bad\"}}"));
    }
    private String join(List<CompletionDelta> deltas, String field) {
        return deltas.stream().filter(d -> d.field().equals(field)).map(CompletionDelta::text).collect(java.util.stream.Collectors.joining());
    }
}

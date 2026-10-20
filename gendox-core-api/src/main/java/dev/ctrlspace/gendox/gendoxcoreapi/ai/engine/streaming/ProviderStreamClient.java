package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.function.Consumer;

/**
 * Sends an adapter's ordinary request with streaming turned on, using the adapter's own HTTP client
 * and headers, and returns the response in the same type the non-streaming call returns.
 */
public final class ProviderStreamClient {

    /** The stream formats the adapters speak. */
    public enum Protocol { CHAT, MISTRAL, RESPONSES, ANTHROPIC, COHERE }

    private ProviderStreamClient() {
    }

    public static <T> T complete(RestTemplate client, ObjectMapper mapper, String url, HttpHeaders headers,
                                 Object request, Protocol protocol, Class<T> responseType,
                                 Consumer<CompletionDelta> listener) {
        ObjectNode body = mapper.valueToTree(request);
        body.put("stream", true);
        if (protocol == Protocol.CHAT) {
            // OpenAI-compatible APIs send token usage in a last frame only when asked
            body.putObject("stream_options").put("include_usage", true);
        }

        HttpHeaders streamingHeaders = new HttpHeaders();
        streamingHeaders.putAll(headers);
        streamingHeaders.setAccept(List.of(MediaType.TEXT_EVENT_STREAM));

        StreamAccumulator accumulator = new StreamAccumulator(mapper, protocol, listener);
        return client.execute(url, HttpMethod.POST, http -> {
            http.getHeaders().putAll(streamingHeaders);
            mapper.writeValue(http.getBody(), body);
        }, response -> {
            SseReader.read(response.getBody(), accumulator::accept);
            return mapper.treeToValue(accumulator.finish(), responseType);
        });
    }
}

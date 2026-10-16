package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.function.Consumer;

/** Shares the existing HTTP client, headers and response converters with non-streaming adapters. */
public final class ProviderStreamClient {
    public enum Protocol { CHAT, MISTRAL, RESPONSES, ANTHROPIC, COHERE }
    private ProviderStreamClient() {}

    public static <T> T complete(RestTemplate client, ObjectMapper mapper, String url, HttpHeaders headers,
                                 Object request, Protocol protocol, Class<T> responseType,
                                 Consumer<CompletionDelta> listener) {
        ObjectNode body = mapper.valueToTree(request);
        body.put("stream", true);
        if (protocol == Protocol.CHAT) body.putObject("stream_options").put("include_usage", true);
        HttpHeaders streamingHeaders = new HttpHeaders();
        streamingHeaders.putAll(headers);
        streamingHeaders.setAccept(List.of(MediaType.TEXT_EVENT_STREAM));
        var accumulator = new StreamAccumulator(mapper, protocol, listener);
        return client.execute(url, HttpMethod.POST, http -> {
            http.getHeaders().putAll(streamingHeaders);
            mapper.writeValue(http.getBody(), body);
        }, response -> {
            SseReader.read(response.getBody(), accumulator::accept);
            return mapper.treeToValue(accumulator.finish(), responseType);
        });
    }
}

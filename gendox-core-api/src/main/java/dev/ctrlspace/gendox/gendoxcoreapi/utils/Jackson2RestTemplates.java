package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Creates {@link RestTemplate}s that read and write JSON with Jackson 2.
 *
 * <p>Spring Framework 7 uses Jackson 3 by default when it is on the classpath, and it is, because Spring AI
 * needs it. The DTOs of this application are written for Jackson 2: {@code com.fasterxml} {@code JsonNode}
 * fields and annotations such as {@code @JsonSerialize} and {@code @JsonNaming}, which Jackson 3 ignores.
 * A plain {@code new RestTemplate()} would therefore send and read different JSON than before.
 *
 * <p>Remove this class when the application moves to Jackson 3.
 */
@SuppressWarnings("removal")
public final class Jackson2RestTemplates {

    private Jackson2RestTemplates() {
    }

    public static RestTemplate create() {
        return useJackson2(new RestTemplate());
    }

    public static RestTemplate create(ClientHttpRequestFactory requestFactory) {
        return useJackson2(new RestTemplate(requestFactory));
    }

    /**
     * Replaces the Jackson 3 JSON converter of the given template with the Jackson 2 one, in the same position.
     */
    public static RestTemplate useJackson2(RestTemplate restTemplate) {
        List<HttpMessageConverter<?>> converters = restTemplate.getMessageConverters();
        boolean hasJackson2 = converters.stream().anyMatch(MappingJackson2HttpMessageConverter.class::isInstance);
        for (int i = converters.size() - 1; i >= 0; i--) {
            if (converters.get(i) instanceof JacksonJsonHttpMessageConverter) {
                if (hasJackson2) {
                    converters.remove(i);
                } else {
                    converters.set(i, new MappingJackson2HttpMessageConverter());
                    hasJackson2 = true;
                }
            }
        }
        return restTemplate;
    }
}

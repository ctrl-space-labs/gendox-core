package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.OpenAiClient;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.MessageRestClient;
import io.micrometer.tracing.Tracer;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;
import org.springframework.web.util.DefaultUriBuilderFactory;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class RestClientConfiguration {



    @Value("${gendox.domain.base-url}")
    private String baseUrl;
    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Bean
    public OpenAiClient openAiService() {
//return null;

        RestClient restClient = RestClient.create("https://api.openai.com/v1");

        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
        return httpServiceProxyFactory.createClient(OpenAiClient.class);
    }



    @Bean
    public MessageRestClient messageRestClientService(Tracer tracer) {
//return null;
        String base = baseUrl + contextPath;

        RestTemplate restTemplate = createRestTempleteWithObservabilityParams(tracer, base);


        RestClient restClient = RestClient.create(restTemplate);
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
        return httpServiceProxyFactory.createClient(MessageRestClient.class);
    }

    @NotNull
    private static RestTemplate createRestTempleteWithObservabilityParams(Tracer tracer, String base) {
        RestTemplate restTemplate = new RestTemplate();
        DefaultUriBuilderFactory uriBuilderFactory = new DefaultUriBuilderFactory(base);
        restTemplate.setUriTemplateHandler(uriBuilderFactory);

        List<ClientHttpRequestInterceptor> interceptors = new ArrayList<>(restTemplate.getInterceptors());

        interceptors.add((HttpRequest request, byte[] body, ClientHttpRequestExecution execution) -> {
            if (tracer.currentSpan() != null) {
                request.getHeaders().add("X-B3-TraceId", tracer.currentSpan().context().traceId());
                request.getHeaders().add("X-B3-SpanId", tracer.currentSpan().context().spanId());
                // add additional headers like parent span id, sample decision, etc., if needed
            }
            return execution.execute(request, body);
        });

        restTemplate.setInterceptors(interceptors);
        return restTemplate;
    }

}

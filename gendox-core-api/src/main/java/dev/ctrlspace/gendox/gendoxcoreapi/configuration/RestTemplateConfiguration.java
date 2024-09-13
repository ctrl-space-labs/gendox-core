package dev.ctrlspace.gendox.gendoxcoreapi.configuration;


import io.micrometer.tracing.Tracer;
import org.jetbrains.annotations.NotNull;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class RestTemplateConfiguration {

    @Bean
    public RestTemplate restTemplate(Tracer tracer) {
        RestTemplate restTemplate = createRestTemplateWithObservabilityParams(tracer);

        return restTemplate;
    }


    @NotNull
    private static RestTemplate createRestTemplateWithObservabilityParams(Tracer tracer) {
        RestTemplate restTemplate = new RestTemplate();

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

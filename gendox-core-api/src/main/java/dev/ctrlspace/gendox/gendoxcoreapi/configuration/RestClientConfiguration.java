package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.OpenAiClient;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.post.MessageRestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class RestClientConfiguration {

    @Value("${gendox.domain.base-url}")
    private String baseUrl;

    @Value("${server.servlet.context-path}")
    private String contextPath;

    @Bean
    public OpenAiClient openAiService(RestClient.Builder builder) {
        return client(builder, "https://api.openai.com/v1", OpenAiClient.class);
    }

    @Bean
    public MessageRestClient messageRestClientService(RestClient.Builder builder) {
        return client(builder, baseUrl + contextPath, MessageRestClient.class);
    }

    private static <T> T client(RestClient.Builder builder, String baseUrl, Class<T> type) {
        // Keep Boot's JSON converter selection, observation registry and propagation customizers.
        RestClient restClient = builder.clone().baseUrl(baseUrl).build();
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient))
                .build().createClient(type);
    }
}

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
    public OpenAiClient openAiService() {
//return null;

        RestClient restClient = RestClient.create("https://api.openai.com/v1");
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
        return httpServiceProxyFactory.createClient(OpenAiClient.class);
    }



    @Bean
    public MessageRestClient messageRestClientService() {
//return null;

        String base = baseUrl + contextPath;

        RestClient restClient = RestClient.create(base);
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
        return httpServiceProxyFactory.createClient(MessageRestClient.class);
    }

}

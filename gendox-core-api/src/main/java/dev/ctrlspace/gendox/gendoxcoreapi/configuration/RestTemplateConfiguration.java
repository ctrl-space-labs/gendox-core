package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import org.springframework.core.task.TaskDecorator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.restclient.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfiguration {

    @Value("${gendox.rest-template.connection-timeout-ms}")
    private int connectionTimeoutMillis;

    @Value("${gendox.rest-template.read-timeout-ms}")
    private int readTimeoutMillis;

    /**
     * This bean will be used by all @Async methods (because it's named "taskExecutor").
     * SimpleAsyncTaskExecutor supports virtual threads + task decoration.
     */
    @Bean(name = "taskExecutor")
    public SimpleAsyncTaskExecutor taskExecutor(TaskDecorator taskDecorator) {
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("async-");
        executor.setVirtualThreads(true);
        executor.setTaskDecorator(taskDecorator);
        // Set the concurrency limit to not look like a DOS attack :)
        executor.setConcurrencyLimit(500);
        return executor;
    }

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectionTimeoutMillis);
        requestFactory.setReadTimeout(readTimeoutMillis);

        // Boot's builder installs observations and W3C propagation without manual trace headers.
        return builder.requestFactory(() -> requestFactory).build();
    }

}

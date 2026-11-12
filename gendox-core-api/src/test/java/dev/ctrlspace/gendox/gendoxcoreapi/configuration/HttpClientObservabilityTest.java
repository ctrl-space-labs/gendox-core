package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.fasterxml.jackson.databind.JsonNode;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.jackson2.autoconfigure.Jackson2AutoConfiguration;
import org.springframework.boot.http.converter.autoconfigure.HttpMessageConvertersAutoConfiguration;
import org.springframework.boot.micrometer.observation.autoconfigure.ObservationAutoConfiguration;
import org.springframework.boot.restclient.autoconfigure.*;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class HttpClientObservabilityTest {
    record Payload(JsonNode arguments) { }

    @Test
    void bootBuildersObserveBothClientsKeepJackson2AndOmitFullUrls() {
        new ApplicationContextRunner()
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withConfiguration(AutoConfigurations.of(ObservationAutoConfiguration.class,
                        Jackson2AutoConfiguration.class, HttpMessageConvertersAutoConfiguration.class,
                        RestTemplateAutoConfiguration.class, RestTemplateObservationAutoConfiguration.class,
                        RestClientAutoConfiguration.class, RestClientObservationAutoConfiguration.class))
                .withUserConfiguration(ObservabilityConfiguration.class, RestTemplateConfiguration.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    ObservationRegistry registry = context.getBean(ObservationRegistry.class);
                    List<Observation.Context> stopped = new ArrayList<>();
                    registry.observationConfig().observationHandler(new ObservationHandler<Observation.Context>() {
                        public boolean supportsContext(Observation.Context observation) { return true; }
                        public void onStop(Observation.Context observation) { stopped.add(observation); }
                    });
                    String url = "https://provider.example/completion?api_key=secret-sentinel";
                    String json = "{\"arguments\":{\"hits\":3}}";
                    RestTemplate template = context.getBean(RestTemplate.class);
                    MockRestServiceServer server = MockRestServiceServer.bindTo(template).build();
                    server.expect(requestTo(url)).andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
                    assertThat(template.getForObject(url, Payload.class).arguments().get("hits").asInt()).isEqualTo(3);
                    server.verify();

                    RestClient.Builder builder = context.getBean(RestClient.Builder.class);
                    MockRestServiceServer clientServer = MockRestServiceServer.bindTo(builder).build();
                    clientServer.expect(requestTo(url)).andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
                    assertThat(builder.build().get().uri(url).retrieve().body(Payload.class).arguments().get("hits").asInt()).isEqualTo(3);
                    clientServer.verify();
                    assertThat(stopped).hasSize(2);
                    for (Observation.Context observation : stopped) {
                        assertThat(observation.getName()).isEqualTo("http.client.requests");
                        assertThat(observation.getHighCardinalityKeyValues()).isEmpty();
                        assertThat(observation.getAllKeyValues().toString()).doesNotContain("secret-sentinel");
                    }
                });
    }
}

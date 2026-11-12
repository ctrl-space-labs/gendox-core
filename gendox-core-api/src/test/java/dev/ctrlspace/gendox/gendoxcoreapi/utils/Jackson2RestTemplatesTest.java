package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SuppressWarnings("removal")
class Jackson2RestTemplatesTest {

    record Payload(String name, JsonNode arguments) {
    }

    @Test
    void theJsonConverterIsJackson2Only() {
        RestTemplate restTemplate = Jackson2RestTemplates.create();

        assertThat(restTemplate.getMessageConverters()).noneMatch(JacksonJsonHttpMessageConverter.class::isInstance);
        assertThat(restTemplate.getMessageConverters()).filteredOn(MappingJackson2HttpMessageConverter.class::isInstance).hasSize(1);
    }

    // Jackson 3 does not know the Jackson 2 tree model: it would write and read a JsonNode as a plain bean.
    @Test
    void aJackson2JsonNodeIsSentAndReadAsJson() {
        RestTemplate restTemplate = Jackson2RestTemplates.create();
        MockRestServiceServer server = MockRestServiceServer.createServer(restTemplate);
        server.expect(requestTo("/tools"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content().json("{\"name\":\"search\",\"arguments\":{\"query\":\"gendox\"}}", true))
                .andRespond(withSuccess("{\"name\":\"search\",\"arguments\":{\"hits\":3}}", MediaType.APPLICATION_JSON));

        Payload request = new Payload("search", JsonNodeFactory.instance.objectNode().put("query", "gendox"));
        Payload response = restTemplate.postForObject("/tools", request, Payload.class);

        server.verify();
        assertThat(response.arguments().get("hits").asInt()).isEqualTo(3);
    }
}

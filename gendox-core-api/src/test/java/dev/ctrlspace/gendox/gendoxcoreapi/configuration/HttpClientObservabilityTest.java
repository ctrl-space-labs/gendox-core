package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.core.type.TypeReference;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiEmbedRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.OpenAiEmbeddingResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request.AnthropicContentBlock;
import tools.jackson.databind.node.JsonNodeFactory;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request.OpenAiCompletionRequest;
import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
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
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class HttpClientObservabilityTest {
    record Payload(JsonNode arguments) { }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
                .withInitializer(new ConfigDataApplicationContextInitializer())
                .withConfiguration(AutoConfigurations.of(ObservationAutoConfiguration.class,
                        JacksonAutoConfiguration.class, HttpMessageConvertersAutoConfiguration.class,
                        RestTemplateAutoConfiguration.class, RestTemplateObservationAutoConfiguration.class,
                        RestClientAutoConfiguration.class, RestClientObservationAutoConfiguration.class))
                .withUserConfiguration(ObservabilityConfiguration.class, RestTemplateConfiguration.class);

    @Test
    void bootBuildersObserveBothClientsPreserveJsonAndOmitFullUrls() {
        runner                .run(context -> {
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
                    Payload payload = new Payload(JsonNodeFactory.instance.objectNode().put("hits", 3));
                    server.expect(requestTo(url)).andExpect(content().json(json))
                            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
                    assertThat(template.postForObject(url, payload, Payload.class).arguments().get("hits").asInt()).isEqualTo(3);
                    server.verify();

                    RestClient.Builder builder = context.getBean(RestClient.Builder.class);
                    MockRestServiceServer clientServer = MockRestServiceServer.bindTo(builder).build();
                    clientServer.expect(requestTo(url)).andExpect(content().json(json))
                            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));
                    assertThat(builder.build().post().uri(url).body(payload).retrieve().body(Payload.class).arguments().get("hits").asInt()).isEqualTo(3);
                    clientServer.verify();
                    assertThat(stopped).hasSize(2);
                    for (Observation.Context observation : stopped) {
                        assertThat(observation.getName()).isEqualTo("http.client.requests");
                        assertThat(observation.getHighCardinalityKeyValues()).isEmpty();
                        assertThat(observation.getAllKeyValues().toString()).doesNotContain("secret-sentinel");
                    }
                });
    }
    @Test
    void providerRequestKeepsSnakeCaseAndNestedSchemaJson() {
        runner.run(context -> {
            RestClient.Builder builder = context.getBean(RestClient.Builder.class);
            MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
            JsonNode schema = JsonNodeFactory.instance.objectNode().put("type", "object")
                    .set("properties", JsonNodeFactory.instance.objectNode()
                            .set("answer", JsonNodeFactory.instance.objectNode().put("type", "string")));
            OpenAiCompletionRequest request = OpenAiCompletionRequest.builder()
                    .model("contract-model").temperature(0.0).topP(0.9).maxTokens(32L)
                    .tools(List.of(OpenAiCompletionRequest.ToolDto.builder().type("function").function(schema).build()))
                    .responseFormat(OpenAiCompletionRequest.ResponseFormat.builder().type("json_schema").jsonSchema(schema).build())
                    .build();
            server.expect(requestTo("/completion")).andExpect(content().json("""
                    {"model":"contract-model","temperature":0.0,"top_p":0.9,"max_tokens":32,
                     "tools":[{"type":"function","function":{"type":"object","properties":{"answer":{"type":"string"}}}}],
                     "response_format":{"type":"json_schema","json_schema":{"type":"object","properties":{"answer":{"type":"string"}}}}}
                    """, true)).andRespond(withSuccess("{\"ok\":true}", MediaType.APPLICATION_JSON));
            JsonNode response = builder.build().post().uri("/completion").body(request).retrieve().body(JsonNode.class);
            assertThat(response.get("ok").asBoolean()).isTrue();
            server.verify();
        });
    }

    @Test
    void embeddingPayloadPreservesVectorsUsageAndSerializableRequestFields() {
        runner.run(context -> {
            RestTemplate client = context.getBean(RestTemplate.class);
            MockRestServiceServer server = MockRestServiceServer.bindTo(client).build();
            server.expect(requestTo("/embeddings"))
                    .andExpect(content().json("{\"model\":\"embedding-model\",\"input\":\"unicode Ω\"}", true))
                    .andRespond(withSuccess("""
                            {"model":"embedding-model","object":"list",
                             "data":[{"index":0,"object":"embedding","embedding":[0.0,-0.125,1.23456789012345,1e-12]}],
                             "usage":{"prompt_tokens":17,"total_tokens":17},"future_provider_field":true}
                            """, MediaType.APPLICATION_JSON));
            OpenAiEmbeddingResponse response = client.postForObject("/embeddings",
                    OpenAiEmbedRequest.builder().model("embedding-model").input("unicode Ω").build(), OpenAiEmbeddingResponse.class);
            assertThat(response.getData().getFirst().getEmbedding()).containsExactly(0.0, -0.125, 1.23456789012345, 1e-12);
            assertThat(response.getData().getFirst().getIndex()).isZero();
            assertThat(response.getUsage().getPromptTokens()).isEqualTo(17);
            assertThat(response.getUsage().getTotalTokens()).isEqualTo(17);
            server.verify();
        });
    }

    @Test
    void providerMessagesKeepIgnoredAndWriteOnlyFieldsOutOfJson() {
        runner.run(context -> {
            ObjectMapper mapper = context.getBean(ObjectMapper.class);
            AiModelMessage message = mapper.readValue("""
                    {"role":"assistant","content":"public answer","reasoning_content":"private reasoning"}
                    """, AiModelMessage.class);
            message.setId(java.util.UUID.randomUUID());
            message.setAiModelId(java.util.UUID.randomUUID());
            message.setReasoningMetadata(mapper.readTree("{\"signature\":\"private replay token\"}"));
            assertThat(message.getReasoningContent()).isEqualTo("private reasoning");
            JsonNode json = mapper.valueToTree(message);
            assertThat(json.get("content").asText()).isEqualTo("public answer");
            for (String field : List.of("id", "aiModelId", "reasoningMetadata", "reasoning_content", "contentParts")) {
                assertThat(json.has(field)).as(field).isFalse();
            }
            assertThat(json.toString()).doesNotContain("private reasoning", "private replay token");
        });
    }

    @Test
    void polymorphicProviderBlocksPreserveTheirTypeAndAnnotatedFieldNames() {
        runner.run(context -> {
            ObjectMapper mapper = context.getBean(ObjectMapper.class);
            String json = """
                    [{"type":"text","text":"hello"},
                     {"type":"tool_use","id":"call-1","name":"search","input":{"query":"Ω"}},
                     {"type":"tool_result","tool_use_id":"call-1","content":"done"}]
                    """;
            List<AnthropicContentBlock> blocks = mapper.readValue(json, new TypeReference<>() { });
            assertThat(blocks.get(0)).isInstanceOf(AnthropicContentBlock.Text.class);
            assertThat(blocks.get(1)).isInstanceOf(AnthropicContentBlock.ToolUse.class);
            assertThat(blocks.get(2)).isInstanceOf(AnthropicContentBlock.ToolResult.class);
            JsonNode reloaded = mapper.readTree(mapper.writeValueAsString(blocks));
            assertThat(reloaded).isEqualTo(mapper.readTree(json));
        });
    }

    @Test
    void projectJsonBindsAndOmitsReverseEntityCollections() {
        runner.run(context -> {
            ObjectMapper mapper = context.getBean(ObjectMapper.class);
            var input = mapper.readValue("{\"name\":\"contract\",\"projectAgent\":{}}",
                    ProjectDTO.class);
            assertThat(input.getName()).isEqualTo("contract");
            assertThat(input.getProjectAgent().getAiTools()).isEmpty();
            var config = mapper.readValue("{}", dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.InsightConfigDTO.class);
            assertThat(config.getVersion()).isEqualTo(1);
            assertThat(config.getAnswerMode().name()).isEqualTo("GENERATED_TEXT");
            var node = mapper.readValue("{}", dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.TaskNodeValueDTO.class);
            assertThat(node.getDocumentMetadata()).isNotNull();
            var project = new Project();
            var member = new ProjectMember();
            member.setProject(project);
            project.setProjectMembers(List.of(member));
            project.setProjectDocuments(List.of(new ProjectDocument()));
            JsonNode json = mapper.valueToTree(project);
            assertThat(json.has("projectMembers")).isFalse();
            assertThat(json.has("projectDocuments")).isFalse();
        });
    }

}

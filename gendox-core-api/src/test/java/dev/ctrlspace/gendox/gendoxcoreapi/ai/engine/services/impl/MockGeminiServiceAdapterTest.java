package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.impl;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.node.JsonNodeFactory;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class MockGeminiServiceAdapterTest {
    private final MockGeminiServiceAdapter adapter = new MockGeminiServiceAdapter();
    private final AiModel model = new AiModel();
    { model.setModel("mock-gemini-2.0-flash"); }
    private final AiModelRequestParams params = AiModelRequestParams.builder().maxTokens(100L).temperature(0.1).topP(1.0).build();
    private final List<AiTools> tools = List.of(AiTools.builder().type("function")
            .jsonSchema("{\"name\":\"advanced_search\",\"parameters\":{\"type\":\"object\"}}").build());

    @Test
    void requiredSearchProducesAnExecutableCallAndAutoProducesTheFinalAnswer() {
        var user = AiModelMessage.builder().role("user").content("Explain least squares").build();
        var first = adapter.askCompletion(List.of(user), "Test", model, params, "", tools, "required", null);
        var call = first.getChoices().getFirst().getMessage().getToolCalls().get(0);
        assertEquals("advanced_search", call.path("function").path("name").asText());
        assertTrue(call.path("function").path("arguments").asText().contains("Explain least squares"));
        var tool = AiModelMessage.builder().role("tool").content("{\"sections\":[]}").toolCallId(call.path("id").asText()).build();
        var second = adapter.askCompletion(List.of(user, first.getChoices().getFirst().getMessage(), tool), "Test", model, params, "", tools, "auto", null);
        assertNull(second.getChoices().getFirst().getMessage().getToolCalls());
        assertTrue(second.getChoices().getFirst().getMessage().getContent().contains("MOCK GEMINI RESPONSE"));
    }

    @Test
    void structuredInsightsUseTheQuestionIdsFromTheRequest() {
        var schema = JsonNodeFactory.instance.objectNode();
        schema.putObject("schema").putObject("properties").putObject("completionAnswers");
        String id = "15a6a61a-82d3-40dd-9258-22d6ad348050";
        String request = "{\"questionId\":\"" + id + "\",\"questionText\":\"What?\"}";
        var response = adapter.askCompletion(List.of(AiModelMessage.builder().role("user").content(request).build()),
                "Test", model, params, "", List.of(), "auto", schema);
        String answer = response.getChoices().getFirst().getMessage().getContent();
        assertTrue(answer.contains(id));
        assertTrue(answer.contains("completionAnswers"));
    }

    @Test
    void noRequiredSearchKeepsTheExistingCannedAnswer() {
        var result = adapter.askCompletion(List.of(AiModelMessage.builder().role("user").content("Hello").build()),
                "Test", model, params, "", List.of(), "required", null);
        assertNull(result.getChoices().getFirst().getMessage().getToolCalls());
        assertEquals("stop", result.getChoices().getFirst().getFinishReason());
    }
}

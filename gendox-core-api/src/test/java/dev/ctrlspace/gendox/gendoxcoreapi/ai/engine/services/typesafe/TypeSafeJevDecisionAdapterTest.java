package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.typesafe;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionKind;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionQuestionConfigDTO;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class TypeSafeJevDecisionAdapterTest {

    @Test
    void mapsCanonicalBooleanQuestionToJevNoul() throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        TypeSafeJevDecisionAdapter adapter = new TypeSafeJevDecisionAdapter(restTemplate);
        AiModel model = new AiModel();
        model.setModel("jev-latest");
        model.setUrl("https://api.typesafe.ai/v1/systemone");

        server.expect(once(), requestTo(model.getUrl()))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer secret"))
                .andExpect(jsonPath("$.model").value("jev-latest"))
                .andExpect(jsonPath("$.questions.eligible.type").value("noul"))
                .andRespond(withSuccess("""
                        {"model":"jev-latest","answers":{"eligible":{"type":"noul","noul":0.82}}}
                        """, MediaType.APPLICATION_JSON));

        DecisionQuestionConfigDTO question = DecisionQuestionConfigDTO.builder()
                .kind(DecisionKind.BOOLEAN)
                .instructions("Is the applicant eligible?")
                .booleanCriteria(new LinkedHashMap<>(Map.of("true", "Eligible", "false", "Not eligible")))
                .build();
        DecisionResponse response = adapter.evaluate(
                DecisionRequest.builder().state(Map.of("document", "Example")).questions(Map.of("eligible", question)).build(),
                model,
                "secret");

        assertThat(response.getAnswers().get("eligible").getNoul()).isEqualTo(0.82d);
        server.verify();
    }

    @Test
    void supportsOnlyTypeSafeDecisionApi() {
        TypeSafeJevDecisionAdapter adapter = new TypeSafeJevDecisionAdapter(new RestTemplate());
        assertThat(adapter.supports("TYPESAFE_DECISION_API")).isTrue();
        assertThat(adapter.supports("OPEN_AI_API")).isFalse();
    }

    @Test
    void mapsChoiceAndScoreQuestionsWithoutModelSpecificTypesLeakingIntoCallers() throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        TypeSafeJevDecisionAdapter adapter = new TypeSafeJevDecisionAdapter(restTemplate);
        AiModel model = new AiModel();
        model.setModel("jev-latest");
        model.setUrl("https://api.typesafe.ai/v1/systemone");

        server.expect(once(), requestTo(model.getUrl()))
                .andExpect(jsonPath("$.questions.status.type").value("choice"))
                .andExpect(jsonPath("$.questions.status.criteria.citizen").value("Citizen"))
                .andExpect(jsonPath("$.questions.risk.type").value("score"))
                .andExpect(jsonPath("$.questions.risk.criteria[0]").value("Low"))
                .andRespond(withSuccess("""
                        {"model":"jev-latest","answers":{
                          "status":{"type":"choice","choice":"citizen","probabilities":{"citizen":0.8,"resident":0.2}},
                          "risk":{"type":"score","score":1.4,"confidence":0.9}
                        }}
                        """, MediaType.APPLICATION_JSON));

        Map<String, DecisionQuestionConfigDTO> questions = new LinkedHashMap<>();
        questions.put("status", DecisionQuestionConfigDTO.builder()
                .kind(DecisionKind.CHOICE)
                .instructions("Choose the residency status")
                .choices(new LinkedHashMap<>(Map.of("citizen", "Citizen", "resident", "Resident")))
                .build());
        questions.put("risk", DecisionQuestionConfigDTO.builder()
                .kind(DecisionKind.SCORE)
                .instructions("Rate the risk")
                .scoreCriteria(List.of("Low", "Medium", "High"))
                .build());

        DecisionResponse response = adapter.evaluate(
                DecisionRequest.builder().state(Map.of("document", "Example")).questions(questions).build(),
                model,
                "secret");

        assertThat(response.getAnswers().get("status").getChoice()).isEqualTo("citizen");
        assertThat(response.getAnswers().get("risk").getScore()).isEqualTo(1.4d);
        server.verify();
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.typesafe;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.DecisionModelApiAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.taskDTOs.DecisionQuestionConfigDTO;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class TypeSafeJevDecisionAdapter implements DecisionModelApiAdapter {
    private static final String API_TYPE = "TYPESAFE_DECISION_API";
    private final RestTemplate restTemplate;

    public TypeSafeJevDecisionAdapter(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public DecisionResponse evaluate(DecisionRequest request, AiModel model, String apiKey) throws GendoxException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("state", request.getState());
        body.put("model", model.getModel());
        Map<String, Object> questions = new LinkedHashMap<>();
        request.getQuestions().forEach((key, config) -> questions.put(key, toJevQuestion(config)));
        body.put("questions", questions);

        try {
            ResponseEntity<DecisionResponse> response = restTemplate.postForEntity(
                    model.getUrl(), new HttpEntity<>(body, headers), DecisionResponse.class);
            if (response.getBody() == null) {
                throw new GendoxException("EMPTY_DECISION_RESPONSE", "The decision model returned no body", HttpStatus.BAD_GATEWAY);
            }
            return response.getBody();
        } catch (RestClientException exception) {
            throw new GendoxException("DECISION_REQUEST_FAILED", "Decision model request failed: " + exception.getMessage(), HttpStatus.BAD_GATEWAY);
        }
    }

    private Map<String, Object> toJevQuestion(DecisionQuestionConfigDTO config) {
        Map<String, Object> question = new LinkedHashMap<>();
        question.put("type", switch (config.getKind()) {
            case BOOLEAN -> "noul";
            case CHOICE -> "choice";
            case SCORE -> "score";
        });
        question.put("instructions", config.getInstructions());
        Object criteria = switch (config.getKind()) {
            case BOOLEAN -> config.getBooleanCriteria();
            case CHOICE -> config.getChoices();
            case SCORE -> config.getScoreCriteria();
        };
        boolean hasCriteria = switch (criteria) {
            case Map<?, ?> map -> !map.isEmpty();
            case java.util.Collection<?> collection -> !collection.isEmpty();
            case null -> false;
            default -> true;
        };
        if (hasCriteria) question.put("criteria", criteria);
        return question;
    }

    @Override
    public boolean supports(String apiTypeName) {
        return API_TYPE.equals(apiTypeName);
    }
}

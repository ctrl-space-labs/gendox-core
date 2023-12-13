package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import io.swagger.models.Swagger;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class OpenAiGpt35ModerationResponse {
    private String id;
    private String model;
    private List<OpenAiGpt35ModerationResult> results;



    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder(toBuilder = true)
    public static class OpenAiGpt35ModerationResult {
        private boolean flagged;
        private Map<String, Boolean> categories;
        private Map<String, Double> category_scores;
    }
}

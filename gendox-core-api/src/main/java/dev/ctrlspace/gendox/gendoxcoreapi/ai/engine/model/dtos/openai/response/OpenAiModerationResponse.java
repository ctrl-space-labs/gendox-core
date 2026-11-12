package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
@Builder(toBuilder = true)
public class OpenAiModerationResponse {
    private String id;
    private String model;
    private List<OpenAiGpt35ModerationResult> results;



    @Data
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    @Builder(toBuilder = true)
    public static class OpenAiGpt35ModerationResult {
        private boolean flagged;
        private Map<String, Boolean> categories;
        private Map<String, Double> category_scores;
    }
}

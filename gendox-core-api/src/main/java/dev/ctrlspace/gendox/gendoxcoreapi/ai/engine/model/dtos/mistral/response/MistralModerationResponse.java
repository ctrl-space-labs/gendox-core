package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MistralModerationResponse {

    private String id;
    private String model;
    private List<Result> results;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Result {
        private Map<String, Boolean> categories;
        private Map<String, Double> category_scores;
    }
}


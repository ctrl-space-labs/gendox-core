package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;

import com.fasterxml.jackson.annotation.JsonCreator;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.response.MistralModerationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
public class ModerationResponse {

    private String id;
    private String model;
    private List<Result> results;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Result {
        private boolean flagged;
        private Map<String, Boolean> categories;
        private Map<String, Double> category_scores;
    }

}

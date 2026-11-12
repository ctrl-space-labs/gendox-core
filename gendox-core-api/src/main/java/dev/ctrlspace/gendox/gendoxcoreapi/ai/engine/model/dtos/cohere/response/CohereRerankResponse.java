package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;

import com.fasterxml.jackson.annotation.JsonCreator;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor(onConstructor_ = @JsonCreator)
public class CohereRerankResponse {
    private String id;
    private List<Result> results;
    private Meta meta;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Result {
        private int index;
        private double relevance_score;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Meta {
        private ApiVersion api_version;
        private BilledUnits billed_units;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class ApiVersion {
        private String version;
        private boolean is_experimental;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class BilledUnits {
        private int search_units;
    }
}



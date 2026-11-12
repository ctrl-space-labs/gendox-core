package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.response;

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
public class VoyageRerankResponse {
    private String object;
    private List<Result> data;
    private String model;
    private Usage usage;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Result {
        private double relevance_score;
        private int index;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Usage {
        private int total_tokens;
    }
}


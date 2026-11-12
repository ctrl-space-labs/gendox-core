package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic;

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
public class RerankResponse {
    private String id;
    private List<Result> results;
    private Integer total_tokens;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor(onConstructor_ = @JsonCreator)
    public static class Result {
        private int index;
        private double relevance_score;
    }


}

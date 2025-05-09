package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CohereRerankRequest {

    private String model;
    private String query;
    private List<String> documents;

    @JsonProperty("top_n")
    private Integer topN; // Optional: if you want top results

}


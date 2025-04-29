package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.response;

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
public class CohereMetadata {

    @JsonProperty("api_version")
    private ApiVersion apiVersion;

    @JsonProperty("billed_units")
    private BilledUnits billedUnits;

    private List<String> warnings;

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ApiVersion {
        private String version;

        @JsonProperty("is_experimental")
        private boolean isExperimental;
    }

    @Data
    @Builder(toBuilder = true)
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BilledUnits {
        @JsonProperty("input_tokens")
        private Integer inputTokens;
    }
}


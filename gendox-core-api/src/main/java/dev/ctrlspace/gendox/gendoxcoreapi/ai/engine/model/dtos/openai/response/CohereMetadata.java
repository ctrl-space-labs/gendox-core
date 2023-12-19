package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CohereMetadata {
    @JsonProperty("api_version")
    private CohereApiVersion apiVersion;
    @JsonProperty("billed_units")
    private CohereBilledUnits billedUnits;
}

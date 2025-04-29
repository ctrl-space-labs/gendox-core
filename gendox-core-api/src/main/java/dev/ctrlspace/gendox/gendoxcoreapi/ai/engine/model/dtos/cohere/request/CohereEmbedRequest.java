package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.cohere.request;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class CohereEmbedRequest implements Serializable {

    private String model;
    @JsonProperty("input_type")
    private String inputType;
    private List<String> texts;
    @JsonProperty("embedding_types")
    private List<String> embeddingTypes;
}

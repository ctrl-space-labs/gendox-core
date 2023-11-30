package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class GptRequestParams {

    private String url;
    @JsonProperty("max_token")
    private Long maxToken;
    @JsonProperty("temperature")
    private Double temperature;
    @JsonProperty("top_p")
    private Double topP;

}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class Ada2Request implements Serializable {

    private String model;
    private String input;
    private Double temperature;
    @JsonProperty("max_tokens")
    private Integer maxTokens;
    @JsonProperty("top_p")
    private Double topP;

}





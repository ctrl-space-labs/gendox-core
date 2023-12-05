package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class RequestParams {
    private String url;
    private Long maxTokens;
    private Double temperature;
    private Double topP;
    private String model;
}

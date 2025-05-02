package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.mistral.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class MistralEmbedRequest {
    private String model;
    private List<String> input;
}


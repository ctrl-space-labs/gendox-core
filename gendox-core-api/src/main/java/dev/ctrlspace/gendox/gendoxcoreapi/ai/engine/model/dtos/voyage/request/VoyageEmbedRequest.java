package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.voyage.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
public class VoyageEmbedRequest {
    private List<String> input;
    private String model;
}

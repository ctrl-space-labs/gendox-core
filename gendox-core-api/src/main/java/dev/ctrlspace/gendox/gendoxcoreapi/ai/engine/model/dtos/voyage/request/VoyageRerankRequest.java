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
public class VoyageRerankRequest {
    private String query;
    private List<String> documents;
    private String model;
}


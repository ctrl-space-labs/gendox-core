package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class EmbeddingGroupDTO {

    private UUID id;
    private UUID sectionId;
    private UUID messageId;
    private UUID embeddingId;
    private Double tokenCount;
    private Long groupingStrategyTypeId;
    private UUID semanticSearchModelId;

}

package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;


import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class ProjectAgentDTO {

    private UUID id;
    private AiModel semanticSearchModel;
    private AiModel completionModel;
    private String agentName;
    private String agentBehavior;
    private Boolean privateAgent;
    private Instant createAt;
    private Instant updateAt;




}

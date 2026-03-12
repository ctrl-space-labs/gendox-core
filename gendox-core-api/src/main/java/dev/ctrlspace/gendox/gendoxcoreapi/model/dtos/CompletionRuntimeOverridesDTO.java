package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class CompletionRuntimeOverridesDTO {

    private String systemPrompt;
    private String completionModelName;
    private Long maxTokens;
    private Double temperature;
    private Double topP;
    private String completionApiKey;

    private UUID projectId;
    private UUID organizationId;
    private UUID createdByAgentUserId;

    @Builder.Default
    private List<AiTools> aiTools = new ArrayList<>();
}

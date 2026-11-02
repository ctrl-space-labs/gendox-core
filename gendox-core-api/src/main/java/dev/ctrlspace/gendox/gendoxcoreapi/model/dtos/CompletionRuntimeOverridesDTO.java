package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
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
    private String reasoningEffort;
    private String completionApiKey;

    private UUID projectId;
    private UUID organizationId;
    private UUID createdByAgentUserId;

    @Builder.Default
    private List<AiTools> aiTools = new ArrayList<>();

    @JsonIgnore
    private CancellationToken cancellationToken;

    private List<AiModelMessage> previousMessages;

    // A resumed chat turn: the messages it already made after its question, and its model calls so far
    private List<AiModelMessage> turnMessages;
    private int turnIterations;

    // Appended to the system prompt, e.g. chat's instructions for searching the documents
    private String instructions;
    // The tool_choice of a turn's first model call (e.g. "required"); later calls use "auto"
    private String firstToolChoice;

    /**
     * Tool names that should be removed from the available tools list before sending the request to the LLM.
     * Use this to prevent a sub-agent from calling tools it should not have access to
     * (e.g. prevent a summarizer sub-agent from spawning further sub-agents).
     */
    @Builder.Default
    private List<String> excludedToolNames = new ArrayList<>();
}

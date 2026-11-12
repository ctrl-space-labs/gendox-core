package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import tools.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ChatSettings;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * An agent's definition: its setup, not its content. Exported as JSON or YAML to copy an agent, keep it in
 * version control or share it as a template. Nothing in it identifies the source organization: no ids, keys or
 * credentials, and models are named, not referenced.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AgentDefinitionDTO {

    /** The version of this file's format, so that a later Gendox can still read older files */
    public static final int FORMAT_VERSION = 1;

    private Integer formatVersion;
    private String name;
    private String description;
    private String behavior;
    private Boolean privateAgent;
    private Models models;
    private Settings settings;
    private ChatSettings chatSettings;
    private List<ToolDefinition> tools;
    private List<SkillDefinition> skills;

    /** The agent's models by their Gendox name */
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Models {
        private String completion;
        private String semanticSearch;
        private String rerank;
        private String moderation;
        private String decision;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Settings {
        private Double temperature;
        private Double topP;
        private Long maxTokens;
        private String reasoningEffort;
        private String searchMode;
        private Long maxSearchLimit;
        private Long maxCompletionLimit;
        private Boolean rerankEnabled;
        private Boolean moderationCheck;
        private Boolean autoTraining;
        private Boolean autoDigitization;
        private String documentSplitter;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ToolDefinition {
        private String type;
        private String execution;
        private JsonNode schema;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SkillDefinition {
        private String name;
        private String description;
        private String content;
    }
}
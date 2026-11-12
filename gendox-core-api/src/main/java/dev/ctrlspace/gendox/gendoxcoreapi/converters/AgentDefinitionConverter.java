package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.annotation.JsonInclude;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.StringNode;
import tools.jackson.dataformat.yaml.YAMLMapper;
import tools.jackson.dataformat.yaml.YAMLWriteFeature;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.AgentDefinitionDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * An agent as its definition file (AgentDefinitionDTO), in JSON or YAML.
 */
@Component
public class AgentDefinitionConverter {

    public static final String APPLICATION_YAML = "application/yaml";

    // YAML for people to read: no "---" line, quotes only where needed, multi-line text (instructions, skills) as blocks.
    // Strings that look like numbers keep their quotes, or reading the file back would turn "123" into 123.
    private static final ObjectMapper YAML = YAMLMapper.builder()
            .disable(YAMLWriteFeature.WRITE_DOC_START_MARKER)
            .enable(YAMLWriteFeature.MINIMIZE_QUOTES)
            .enable(YAMLWriteFeature.ALWAYS_QUOTE_NUMBERS_AS_STRINGS)
            .enable(YAMLWriteFeature.LITERAL_BLOCK_STYLE)
            .changeDefaultPropertyInclusion(inclusion -> inclusion.withValueInclusion(JsonInclude.Include.NON_NULL))
            .build();

    private final ObjectMapper objectMapper;

    @Autowired
    public AgentDefinitionConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public AgentDefinitionDTO toDTO(Project project) {
        ProjectAgent agent = project.getProjectAgent();

        return AgentDefinitionDTO.builder()
                .formatVersion(AgentDefinitionDTO.FORMAT_VERSION)
                .name(project.getName())
                .description(project.getDescription())
                .behavior(agent.getAgentBehavior())
                .privateAgent(agent.getPrivateAgent())
                .models(AgentDefinitionDTO.Models.builder()
                        .completion(nameOf(agent.getCompletionModel()))
                        .semanticSearch(nameOf(agent.getSemanticSearchModel()))
                        .rerank(nameOf(agent.getRerankModel()))
                        .moderation(nameOf(agent.getModerationModel()))
                        .decision(nameOf(agent.getDecisionModel()))
                        .build())
                .settings(AgentDefinitionDTO.Settings.builder()
                        .temperature(agent.getTemperature())
                        .topP(agent.getTopP())
                        .maxTokens(agent.getMaxToken())
                        .reasoningEffort(agent.getReasoningEffort())
                        .searchMode(agent.getAdvancedSearchMode())
                        .maxSearchLimit(agent.getMaxSearchLimit())
                        .maxCompletionLimit(agent.getMaxCompletionLimit())
                        .rerankEnabled(agent.getRerankEnable())
                        .moderationCheck(agent.getModerationCheck())
                        .autoTraining(project.getAutoTraining())
                        .autoDigitization(agent.getAutoDigitization())
                        .documentSplitter(agent.getDocumentSplitterType() != null ? agent.getDocumentSplitterType().getName() : null)
                        .build())
                .chatSettings(agent.getChatSettings())
                .tools(agent.getAiTools().stream()
                        .map(tool -> AgentDefinitionDTO.ToolDefinition.builder()
                                .type(tool.getType())
                                .execution(tool.getExecution())
                                .schema(schemaOf(tool))
                                .build())
                        .toList())
                .skills(agent.getAgentSkills().stream()
                        .map(skill -> AgentDefinitionDTO.SkillDefinition.builder()
                                .name(skill.getName())
                                .description(skill.getDescription())
                                .content(skill.getContent())
                                .build())
                        .toList())
                .build();
    }

    public String toYaml(AgentDefinitionDTO definition) throws JacksonException {
        return YAML.writeValueAsString(definition);
    }

    private static String nameOf(AiModel model) {
        return model != null ? model.getName() : null;
    }

    // the schema as structure, so it reads as JSON or YAML rather than as one quoted string
    private JsonNode schemaOf(AiTools tool) {
        try {
            return objectMapper.readTree(tool.getJsonSchema());
        } catch (JacksonException e) {
            return StringNode.valueOf(tool.getJsonSchema());
        }
    }
}
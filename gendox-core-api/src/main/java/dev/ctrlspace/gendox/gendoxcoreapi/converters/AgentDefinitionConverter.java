package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.TextNode;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.fasterxml.jackson.dataformat.yaml.YAMLGenerator;
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

    // YAML for people to read: no "---" line, quotes only where needed, multi-line text (instructions, skills) as blocks
    private static final ObjectMapper YAML = new ObjectMapper(YAMLFactory.builder()
            .disable(YAMLGenerator.Feature.WRITE_DOC_START_MARKER)
            .enable(YAMLGenerator.Feature.MINIMIZE_QUOTES)
            .enable(YAMLGenerator.Feature.LITERAL_BLOCK_STYLE)
            .build())
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

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

    public String toYaml(AgentDefinitionDTO definition) throws JsonProcessingException {
        return YAML.writeValueAsString(definition);
    }

    private static String nameOf(AiModel model) {
        return model != null ? model.getName() : null;
    }

    // the schema as structure, so it reads as JSON or YAML rather than as one quoted string
    private JsonNode schemaOf(AiTools tool) {
        try {
            return objectMapper.readTree(tool.getJsonSchema());
        } catch (JsonProcessingException e) {
            return TextNode.valueOf(tool.getJsonSchema());
        }
    }
}
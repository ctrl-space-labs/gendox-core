package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.AgentDefinitionDTO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AgentDefinitionConverterTest {

    private final ObjectMapper json = JsonMapper.builder().build();
    private final AgentDefinitionConverter converter = new AgentDefinitionConverter(json);

    @Test
    void yamlReadsBackWithTheSameTypesAsJson() throws Exception {
        JsonNode schema = json.readTree("""
                {"name": "pick", "parameters": {"type": "object", "properties": {
                  "code": {"type": "string", "enum": ["123", "1.5", "true", "null", "007"]},
                  "count": {"type": "integer", "minimum": 1}
                }}}
                """);
        AgentDefinitionDTO definition = AgentDefinitionDTO.builder()
                .formatVersion(AgentDefinitionDTO.FORMAT_VERSION)
                .name("123")
                .behavior("Line one\nLine two")
                .tools(List.of(AgentDefinitionDTO.ToolDefinition.builder().type("function").execution("ACTION").schema(schema).build()))
                .build();

        JsonNode fromYaml = YAMLMapper.builder().build().readTree(converter.toYaml(definition));

        assertEquals(json.valueToTree(definition), fromYaml);
    }
}
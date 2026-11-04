package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.skills;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AgentSkillRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

/**
 * Returns the full SKILL.md of one of the agent's skills. The agent sees only each skill's name and
 * description in its system prompt and reads the rest with this tool. It has no ai_tools row:
 * CompletionService adds it to a completion whenever the completion has skills. A skill the agent
 * doesn't have (the Gendox assistant skill, for a chat from a Gendox page) is read from the library.
 */
@Component
public class ReadSkillTool extends DefinedToolHandler {

    public static final String NAME = "read_skill";

    static final String DEFINITION = """
            {
              "name": "read_skill",
              "description": "Read the full instructions of one of your skills, by its name from the Skills list in your instructions. Read a skill before you follow it.",
              "parameters": {
                "type": "object",
                "required": ["name"],
                "properties": {
                  "name": { "type": "string", "description": "The skill's name, exactly as listed." }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(String name) {
    }

    private final AgentSkillRepository agentSkillRepository;
    private final SkillService skillService;
    private final ObjectMapper objectMapper;

    // lazy: SkillService needs the tool registry, which needs this tool
    public ReadSkillTool(AgentSkillRepository agentSkillRepository, @Lazy SkillService skillService, ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.agentSkillRepository = agentSkillRepository;
        this.skillService = skillService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        if (context.agent() == null) {
            throw new GendoxException("SKILLS_NEED_AN_AGENT", "Skills belong to an agent, and there is none here", HttpStatus.BAD_REQUEST);
        }
        String requested = readArguments(objectMapper, arguments, Args.class).name();
        String name = requested == null ? "" : requested.trim();

        String content = agentSkillRepository.findByAgentIdAndName(context.agent().getId(), name)
                .map(AgentSkill::getContent)
                .or(() -> skillService.getLibrarySkill(name).map(skill -> skill.getContent()))
                .orElse(null);
        if (content == null) {
            String available = agentSkillRepository.findAllByAgentIdOrderByNameAsc(context.agent().getId()).stream()
                    .map(AgentSkill::getName)
                    .collect(Collectors.joining(", "));
            throw new GendoxException("SKILL_NOT_FOUND",
                    "No skill named '" + name + "'. Available skills: " + (available.isEmpty() ? "none" : available),
                    HttpStatus.NOT_FOUND);
        }

        ObjectNode result = objectMapper.createObjectNode();
        result.put("name", name);
        result.put("content", content);
        return result;
    }
}

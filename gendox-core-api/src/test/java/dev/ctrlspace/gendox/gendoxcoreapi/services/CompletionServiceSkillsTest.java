package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AgentSkillRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompletionServiceSkillsTest {

    @Mock private AiToolRegistry aiToolRegistry;
    @Mock private AgentSkillRepository agentSkillRepository;
    @Mock private TypeService typeService;

    private CompletionService completionService;
    private final ProjectAgent agent = new ProjectAgent();

    private static AiTools tool(String name) {
        return AiTools.builder().type("function").jsonSchema("{\"name\":\"" + name + "\",\"parameters\":{}}").build();
    }

    private static AgentSkill skill(String name, String allowedTools) {
        String content = "---\nname: " + name + "\ndescription: When " + name + ".\n"
                + (allowedTools == null ? "" : "allowed-tools: " + allowedTools + "\n") + "---\n# " + name;
        return AgentSkill.builder().name(name).description("When " + name + ".").content(content).build();
    }

    @BeforeEach
    void setUp() {
        completionService = new CompletionService(null, null, null, null, null, null, typeService, null, null, null,
                null, null, null, null, new ObjectMapper(), null, aiToolRegistry, new SkillService(null, agentSkillRepository, aiToolRegistry, null, typeService));
        agent.setId(UUID.randomUUID());
        agent.setAiTools(new ArrayList<>(List.of(tool("advanced_search"))));
        lenient().when(aiToolRegistry.getDefinition(anyString()))
                .thenAnswer(inv -> Optional.of("{\"name\":\"" + inv.getArgument(0) + "\",\"parameters\":{}}"));
    }

    private List<String> names(List<AiTools> tools) {
        ObjectMapper mapper = new ObjectMapper();
        return tools.stream().map(tool -> {
            try {
                return mapper.readTree(tool.getJsonSchema()).path("name").asText();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }).toList();
    }

    @Test
    void anAgentWithoutSkillsGetsOnlyItsOwnTools() {
        assertEquals(List.of("advanced_search"), names(completionService.resolveAvailableTools(agent, null, List.of())));
        verifyNoInteractions(aiToolRegistry);
    }

    @Test
    void skillsBringReadSkillAndTheirToolsAndTheAgentsOwnToolWins() {
        List<AiTools> tools = completionService.resolveAvailableTools(agent, null,
                List.of(skill("gendox-assistant", "run_task, advanced_search, list_tasks")));

        assertEquals(List.of("advanced_search", "read_skill", "list_tasks", "run_task"), names(tools));
        assertSame(agent.getAiTools().getFirst(), tools.getFirst(), "the agent's own advanced_search is kept");
        verify(aiToolRegistry, never()).getDefinition("advanced_search");
        assertEquals(1, agent.getAiTools().size(), "the agent's own list is not changed");
    }

    @Test
    void aSkillWithoutToolsStillBringsReadSkill() {
        assertEquals(List.of("advanced_search", "read_skill"),
                names(completionService.resolveAvailableTools(agent, null, List.of(skill("info-card", null)))));
    }

    @Test
    void chatsAndTaskRunsGetTheAgentsSkillsButSubAgentsDoNot() {
        List<AgentSkill> skills = List.of(skill("legal-contract-analysis", "read_document, regex_search"));
        when(agentSkillRepository.findAllByAgentIdOrderByNameAsc(agent.getId())).thenReturn(skills);

        CompletionRuntimeOverridesDTO taskRun = CompletionRuntimeOverridesDTO.builder().completionModelName("m").build();
        CompletionRuntimeOverridesDTO subAgent = CompletionRuntimeOverridesDTO.builder().systemPrompt("You summarise.").build();

        assertEquals(skills, completionService.skillsFor(agent, null, taskRun));
        assertEquals(skills, completionService.skillsFor(agent, null, null));
        assertEquals(List.of(), completionService.skillsFor(agent, null, subAgent));
        assertEquals(List.of(), completionService.skillsFor(null, null, taskRun));
    }

    @Test
    void theHeaderGoesAtTheEndOfTheSystemPromptAndIsStable() {
        List<AgentSkill> skills = List.of(skill("gendox-assistant", null));

        String prompt = completionService.appendSkillsHeader("You are helpful.", skills);

        assertTrue(prompt.startsWith("You are helpful.\n\n## Skills"));
        assertTrue(prompt.contains("---\nname: gendox-assistant\ndescription: When gendox-assistant.\n---"));
        assertEquals(prompt, completionService.appendSkillsHeader("You are helpful.", skills));
        assertEquals("You are helpful.", completionService.appendSkillsHeader("You are helpful.", List.of()));
    }
}

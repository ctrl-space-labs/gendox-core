package dev.ctrlspace.gendox.gendoxcoreapi.services;

import tools.jackson.databind.json.JsonMapper;

import tools.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AgentSkillRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;

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
class CompletionRuntimeContextResolverTest {

    @Mock
    private AiToolRegistry aiToolRegistry;
    @Mock
    private AgentSkillRepository agentSkillRepository;
    @Mock
    private TypeService typeService;
    @Mock
    private SubscriptionValidationService subscriptionValidationService;
    @Mock
    private ArtifactService artifactService;

    private CompletionRuntimeContextResolver resolver;
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
        resolver = new CompletionRuntimeContextResolver(null, typeService, null, null, JsonMapper.shared(), null, aiToolRegistry,
                new SkillService(null, agentSkillRepository, aiToolRegistry, null, typeService, null), null,
                subscriptionValidationService, artifactService);
        agent.setId(UUID.randomUUID());
        agent.setAiTools(new ArrayList<>(List.of(tool("advanced_search"))));
        lenient().when(aiToolRegistry.getDefinition(anyString()))
                .thenAnswer(inv -> Optional.of("{\"name\":\"" + inv.getArgument(0) + "\",\"parameters\":{}}"));
    }

    private List<String> names(List<AiTools> tools) {
        ObjectMapper mapper = JsonMapper.shared();
        return tools.stream().map(tool -> {
            try {
                return mapper.readTree(tool.getJsonSchema()).path("name").asText();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }).toList();
    }

    @Test
    void aDesktopPromptGetsTheClientToolsItRunsAndABrowserPromptNone() {
        MessageLocalContextService contexts = mock(MessageLocalContextService.class);
        CompletionRuntimeContextResolver withContexts = new CompletionRuntimeContextResolver(null, typeService, null, null,
                JsonMapper.shared(), null, aiToolRegistry, new SkillService(null, agentSkillRepository, aiToolRegistry, null, typeService, null), contexts,
                subscriptionValidationService, artifactService);
        dev.ctrlspace.gendox.gendoxcoreapi.model.Message desktop = new dev.ctrlspace.gendox.gendoxcoreapi.model.Message();
        dev.ctrlspace.gendox.gendoxcoreapi.model.Message browser = new dev.ctrlspace.gendox.gendoxcoreapi.model.Message();
        desktop.setValue("From the desktop app");
        browser.setValue("From a browser");
        when(contexts.contextValue(desktop, SkillService.GENDOX_DESKTOP_CONTEXT)).thenReturn(Optional.of(
                "{\"source\":\"gendox-desktop\",\"clientTools\":[\"run_command\",\"format_disk\"]}"));
        when(contexts.contextValue(browser, SkillService.GENDOX_DESKTOP_CONTEXT)).thenReturn(Optional.empty());

        List<String> fromDesktop = withContexts.clientToolNames(desktop, null);
        List<AiTools> desktopTools = withContexts.resolveAvailableTools(agent, null, List.of(), fromDesktop);
        assertEquals(List.of("advanced_search", "run_command"), names(desktopTools));
        assertEquals("CLIENT", desktopTools.get(1).getExecution());
        // only tools Gendox defines: an unknown name a client sends is ignored
        assertEquals(List.of("advanced_search"), names(withContexts.resolveAvailableTools(agent, null, List.of(),
                withContexts.clientToolNames(browser, null))));
        // a sub-agent runs in Gendox, with no client
        CompletionRuntimeOverridesDTO subAgent = new CompletionRuntimeOverridesDTO();
        subAgent.setSystemPrompt("You are a sub-agent.");
        assertEquals(List.of(), withContexts.clientToolNames(desktop, subAgent));
    }

    @Test
    void anAgentToolNamedLikeAClientToolIsNeverOffered() {
        agent.getAiTools().add(tool("run_command"));

        assertEquals(List.of("advanced_search"), names(resolver.resolveAvailableTools(agent, null, List.of(), List.of())));
        List<AiTools> tools = resolver.resolveAvailableTools(agent, null, List.of(), List.of("run_command"));
        assertEquals(List.of("advanced_search", "run_command"), names(tools));
        assertTrue(tools.get(1).getJsonSchema().contains("timeout_seconds"));
    }

    @Test
    void anAgentWithoutSkillsGetsOnlyItsOwnTools() {
        assertEquals(List.of("advanced_search"), names(resolver.resolveAvailableTools(agent, null, List.of())));
        verifyNoInteractions(aiToolRegistry);
    }

    @Test
    void skillsBringReadSkillAndTheirToolsAndTheAgentsOwnToolWins() {
        List<AiTools> tools = resolver.resolveAvailableTools(agent, null,
                List.of(skill("gendox-assistant", "run_task, advanced_search, list_tasks")));

        assertEquals(List.of("advanced_search", "read_skill", "list_tasks", "run_task"), names(tools));
        assertSame(agent.getAiTools().getFirst(), tools.getFirst(), "the agent's own advanced_search is kept");
        verify(aiToolRegistry, never()).getDefinition("advanced_search");
        assertEquals(1, agent.getAiTools().size(), "the agent's own list is not changed");
    }

    @Test
    void aSkillWithoutToolsStillBringsReadSkill() {
        assertEquals(List.of("advanced_search", "read_skill"),
                names(resolver.resolveAvailableTools(agent, null, List.of(skill("info-card", null)))));
    }

    @Test
    void chatsAndTaskRunsGetTheAgentsSkillsButSubAgentsDoNot() {
        List<AgentSkill> skills = List.of(skill("legal-contract-analysis", "read_document, regex_search"));
        when(agentSkillRepository.findAllByAgentIdOrderByNameAsc(agent.getId())).thenReturn(skills);

        CompletionRuntimeOverridesDTO taskRun = CompletionRuntimeOverridesDTO.builder().completionModelName("m").build();
        CompletionRuntimeOverridesDTO subAgent = CompletionRuntimeOverridesDTO.builder().systemPrompt("You summarise.").build();

        assertEquals(skills, resolver.skillsFor(agent, null, taskRun));
        assertEquals(skills, resolver.skillsFor(agent, null, null));
        assertEquals(List.of(), resolver.skillsFor(agent, null, subAgent));
        assertEquals(List.of(), resolver.skillsFor(null, null, taskRun));
    }

    // artifacts: the output floor and the plan

    @Test
    void theArtifactWritingToolsRaiseTheOutputLimitToTheFloor() {
        ReflectionTestUtils.setField(resolver, "minArtifactOutputTokens", 16_000L);

        assertEquals(16_000L, resolver.withArtifactOutputFloor(500L, List.of(tool("advanced_search"), tool("create_artifact"))));
        assertEquals(16_000L, resolver.withArtifactOutputFloor(500L, List.of(tool("update_artifact"))));
    }

    @Test
    void readingAnArtifactOrHavingNoArtifactToolsKeepsTheAgentsLimit() {
        ReflectionTestUtils.setField(resolver, "minArtifactOutputTokens", 16_000L);

        assertEquals(500L, resolver.withArtifactOutputFloor(500L, List.of(tool("read_artifact"))));
        assertEquals(500L, resolver.withArtifactOutputFloor(500L, List.of(tool("advanced_search"))));
    }

    @Test
    void aHigherLimitOfTheAgentStays() {
        ReflectionTestUtils.setField(resolver, "minArtifactOutputTokens", 16_000L);

        assertEquals(32_000L, resolver.withArtifactOutputFloor(32_000L, List.of(tool("create_artifact"))));
    }

    @Test
    void aPlanWithoutArtifactsLosesTheArtifactToolsAndWidgets() {
        UUID organizationId = UUID.randomUUID();
        when(subscriptionValidationService.canUseArtifacts(organizationId)).thenReturn(false);

        List<AiTools> tools = resolver.withArtifactToolsIfPlanAllows(List.of(tool("advanced_search"),
                tool("create_artifact"), tool("update_artifact"), tool("read_artifact"), tool("show_widget")),
                organizationId);

        assertEquals(List.of("advanced_search"), names(tools));
    }

    @Test
    void aPlanWithArtifactsKeepsThem() {
        UUID organizationId = UUID.randomUUID();
        when(subscriptionValidationService.canUseArtifacts(organizationId)).thenReturn(true);

        List<AiTools> tools = resolver.withArtifactToolsIfPlanAllows(List.of(tool("advanced_search"),
                tool("create_artifact"), tool("update_artifact"), tool("read_artifact")), organizationId);

        assertEquals(List.of("advanced_search", "create_artifact", "update_artifact", "read_artifact"), names(tools));
    }

    @Test
    void aWidgetAloneDoesNotRaiseTheOutputLimit() {
        ReflectionTestUtils.setField(resolver, "minArtifactOutputTokens", 16_000L);

        assertEquals(4_000L, resolver.withArtifactOutputFloor(4_000L, List.of(tool("show_widget"))));
    }

    @Test
    void aPublicThreadGetsNoArtifactTools_andKeepsTheOthers() {
        UUID publicThread = UUID.randomUUID();
        when(artifactService.artifactsAllowedIn(publicThread)).thenReturn(false);

        List<AiTools> tools = resolver.withoutArtifactToolsInPublicThreads(List.of(tool("advanced_search"),
                tool("create_artifact"), tool("read_artifact_data"), tool("show_widget")), publicThread);

        assertEquals(List.of("advanced_search"), names(tools));
    }

    @Test
    void aMembersThreadKeepsTheArtifactTools() {
        UUID thread = UUID.randomUUID();
        when(artifactService.artifactsAllowedIn(thread)).thenReturn(true);

        List<AiTools> tools = resolver.withoutArtifactToolsInPublicThreads(List.of(tool("create_artifact")), thread);

        assertEquals(List.of("create_artifact"), names(tools));
    }

    @Test
    void thePlanIsNotReadWhenNoArtifactToolIsOffered() {
        List<AiTools> tools = resolver.withArtifactToolsIfPlanAllows(List.of(tool("advanced_search")), UUID.randomUUID());

        assertEquals(List.of("advanced_search"), names(tools));
        verify(subscriptionValidationService, never()).canUseArtifacts(any());
    }

    @Test
    void theHeaderGoesAtTheEndOfTheSystemPromptAndIsStable() {
        List<AgentSkill> skills = List.of(skill("gendox-assistant", null));

        String prompt = resolver.appendSkillsHeader("You are helpful.", skills);

        assertTrue(prompt.startsWith("You are helpful.\n\n## Skills"));
        assertTrue(prompt.contains("---\nname: gendox-assistant\ndescription: When gendox-assistant.\n---"));
        assertEquals(prompt, resolver.appendSkillsHeader("You are helpful.", skills));
        assertEquals("You are helpful.", resolver.appendSkillsHeader("You are helpful.", List.of()));
    }
}

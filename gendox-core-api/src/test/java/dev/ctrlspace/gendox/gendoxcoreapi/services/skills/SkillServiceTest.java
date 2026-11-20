package dev.ctrlspace.gendox.gendoxcoreapi.services.skills;

import tools.jackson.databind.json.JsonMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.services.TypeService;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageLocalContextRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Skill;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AgentSkillRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SkillServiceTest {

    @InjectMocks
    private SkillService skillService;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private AgentSkillRepository agentSkillRepository;

    @Mock
    private AiToolRegistry aiToolRegistry;

    @Mock
    private MessageLocalContextRepository messageLocalContextRepository;

    @Mock
    private TypeService typeService;

    private static String md(String name, String description, String body) {
        return "---\nname: " + name + "\ndescription: " + description + "\n---\n" + body;
    }

    private static MessageLocalContext context(String type) {
        MessageLocalContext context = new MessageLocalContext();
        context.setContextTypeName(type);
        return context;
    }

    private static Skill version(String name, int version, boolean latest, String content) {
        return Skill.builder().id(UUID.randomUUID()).name(name).description("d").content(content)
                .version(version).latest(latest).deleted(false).build();
    }

    @Test
    void publishingANewVersionMovesEveryAgentThatStillHasTheSkill() throws GendoxException {
        Skill v1 = version("gendox-assistant", 1, false, md("gendox-assistant", "d", "old"));
        Skill v2 = version("gendox-assistant", 2, true, md("gendox-assistant", "d", "v2"));
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.of(v2));
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        String content = md("gendox-assistant", "new description", "v3");
        when(skillRepository.findAllByNameOrderByVersionDesc("gendox-assistant"))
                .thenAnswer(inv -> List.of(v2, v1));

        Skill v3 = skillService.publishNewVersion("gendox-assistant", content);

        assertEquals(3, v3.getVersion());
        assertTrue(v3.getLatest());
        assertFalse(v2.getLatest());
        assertEquals("new description", v3.getDescription());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<UUID>> fromIds = ArgumentCaptor.forClass(Collection.class);
        verify(agentSkillRepository).moveCopiesToVersion(fromIds.capture(), eq(v3.getId()),
                eq("gendox-assistant"), eq("new description"), eq(content));
        assertTrue(fromIds.getValue().containsAll(List.of(v1.getId(), v2.getId())));
    }

    @Test
    void aNewVersionCannotRenameTheSkill() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> skillService.publishNewVersion("gendox-assistant", md("another-name", "d", "x")));
        assertEquals("SKILL_NAME_CHANGE_NOT_ALLOWED", e.getErrorCode());
        verifyNoInteractions(agentSkillRepository);
    }

    @Test
    void publishingTheSameContentChangesNothing() throws GendoxException {
        String content = md("info-card", "d", "same");
        Skill latest = version("info-card", 4, true, content);
        when(skillRepository.findByNameAndLatestTrue("info-card")).thenReturn(Optional.of(latest));

        assertSame(latest, skillService.publishNewVersion("info-card", content));
        verify(skillRepository, never()).save(any());
        verifyNoInteractions(agentSkillRepository);
    }

    @Test
    void creatingASkillThatExistsIsAConflict() {
        when(skillRepository.findByNameAndLatestTrue("info-card"))
                .thenReturn(Optional.of(version("info-card", 1, true, md("info-card", "d", ""))));

        GendoxException e = assertThrows(GendoxException.class,
                () -> skillService.create(md("info-card", "d", "")));
        assertEquals("SKILL_ALREADY_EXISTS", e.getErrorCode());
    }

    @Test
    void theHeaderIsEachSkillsFrontMatterSortedByName() {
        String bFile = "---\r\nname: b-skill\r\ndescription: When B.\r\nallowed-tools: read_document\r\n---\r\nBody of B";
        AgentSkill b = AgentSkill.builder().name("b-skill").description("When B.").content(bFile).build();
        AgentSkill a = AgentSkill.builder().name("a-skill").description("When A.").content(md("a-skill", "When A.", "Body of A")).build();

        String header = skillService.buildSkillsHeader(List.of(b, a));

        assertEquals(header, skillService.buildSkillsHeader(List.of(a, b)));
        assertTrue(header.contains("---\nname: a-skill\ndescription: When A.\n---\n\n---\nname: b-skill\ndescription: When B.\nallowed-tools: read_document\n---"));
        assertFalse(header.contains("Body of"));
        assertTrue(header.endsWith("Read a skill with read_skill(name) before you follow it."));
        assertNull(skillService.buildSkillsHeader(List.of()));
    }

    @Test
    void aChatFromAGendoxPageGetsTheAssistantSkillFromTheLibrary() {
        UUID agentId = UUID.randomUUID();
        Skill assistant = version("gendox-assistant", 2, true, md("gendox-assistant", "d", ""));
        AgentSkill own = AgentSkill.builder().name("info-card").content("mine").build();
        when(agentSkillRepository.findAllByAgentIdOrderByNameAsc(agentId)).thenReturn(List.of(own));
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.of(assistant));
        Message fromPage = new Message();
        fromPage.setId(UUID.randomUUID());
        when(messageLocalContextRepository.existsByMessage_IdAndContextTypeName(fromPage.getId(), "GENDOX_PAGE")).thenReturn(true);
        Message elsewhere = new Message();
        elsewhere.setId(UUID.randomUUID());

        List<AgentSkill> pageSkills = skillService.getCompletionSkills(agentId, fromPage);

        assertEquals(List.of("info-card", "gendox-assistant"), pageSkills.stream().map(AgentSkill::getName).toList());
        assertEquals(assistant.getId(), pageSkills.get(1).getSkillId());
        assertEquals(List.of(own), skillService.getCompletionSkills(agentId, elsewhere));
    }

    @Test
    void aChatWithAttachedFilesGetsTheFilesSkill() {
        UUID agentId = UUID.randomUUID();
        Skill files = version("gendox-files", 1, true, md("gendox-files", "d", "body"));
        when(skillRepository.findByNameAndLatestTrue("gendox-files")).thenReturn(Optional.of(files));
        Message withFiles = new Message();
        withFiles.setThreadId(UUID.randomUUID());
        when(messageLocalContextRepository.existsByMessage_ThreadIdAndDocumentIsNotNull(withFiles.getThreadId())).thenReturn(true);
        Message without = new Message();
        without.setThreadId(UUID.randomUUID());

        assertEquals(List.of("gendox-files"),
                skillService.getCompletionSkills(agentId, withFiles).stream().map(AgentSkill::getName).toList());
        assertEquals(List.of(), skillService.getCompletionSkills(agentId, without));
    }

    @Test
    void anAgentThatHasTheAssistantSkillDoesNotGetItTwice() {
        UUID agentId = UUID.randomUUID();
        AgentSkill linked = AgentSkill.builder().name("gendox-assistant").content("linked").build();
        when(agentSkillRepository.findAllByAgentIdOrderByNameAsc(agentId)).thenReturn(List.of(linked));
        Message fromPage = new Message();
        MessageLocalContext page = new MessageLocalContext();
        page.setContextTypeName("GENDOX_PAGE");
        fromPage.getLocalContexts().add(page);

        assertEquals(List.of(linked), skillService.getCompletionSkills(agentId, fromPage));
        verify(skillRepository, never()).findByNameAndLatestTrue(any());
    }

    @Test
    void desktopSkillIsAddedOnlyForTheCurrentDesktopPromptAndSurvivesResume() {
        UUID agentId = UUID.randomUUID();
        Skill desktop = version("gendox-desktop", 1, true, md("gendox-desktop", "Desktop context", "Use local tools."));
        when(skillRepository.findByNameAndLatestTrue("gendox-desktop")).thenReturn(Optional.of(desktop));
        Message unsaved = new Message();
        unsaved.getLocalContexts().add(context("GENDOX_DESKTOP"));
        assertEquals(List.of("gendox-desktop"), skillService.getCompletionSkills(agentId, unsaved)
                .stream().map(AgentSkill::getName).toList());
        UUID threadId = UUID.randomUUID();
        Message desktopPrompt = new Message();
        desktopPrompt.setId(UUID.randomUUID());
        desktopPrompt.setThreadId(threadId);
        when(messageLocalContextRepository.existsByMessage_IdAndContextTypeName(desktopPrompt.getId(), "GENDOX_DESKTOP"))
                .thenReturn(true);
        // A resumed turn reads the same stored prompt without its lazy local-context collection.
        assertEquals(List.of("gendox-desktop"), skillService.getCompletionSkills(agentId, desktopPrompt)
                .stream().map(AgentSkill::getName).toList());
        verify(agentSkillRepository, never()).save(any());

        Message browserPrompt = new Message();
        browserPrompt.setId(UUID.randomUUID());
        browserPrompt.setThreadId(threadId);
        assertTrue(skillService.getCompletionSkills(agentId, browserPrompt).isEmpty(),
                "A later browser prompt must not inherit desktop context from its thread");
        assertTrue(skillService.getCompletionSkills(agentId, null).isEmpty(),
                "Background runs without a desktop prompt must not gain the skill");
    }

    @Test
    void desktopContextAlsoWorksBeforeThePromptIsStoredAndDoesNotDuplicateAssignedSkills() {
        UUID agentId = UUID.randomUUID();
        AgentSkill linked = AgentSkill.builder().name("gendox-desktop").content("customized").build();
        when(agentSkillRepository.findAllByAgentIdOrderByNameAsc(agentId)).thenReturn(List.of(linked));
        Message prompt = new Message();
        prompt.getLocalContexts().add(context("GENDOX_DESKTOP"));
        assertEquals(List.of(linked), skillService.getCompletionSkills(agentId, prompt));
        verify(skillRepository, never()).findByNameAndLatestTrue("gendox-desktop");
    }

    @Test
    void desktopSkillsComposeWithPageAndFilesSkillsAndRespectLibraryDeletion() {
        UUID agentId = UUID.randomUUID();
        for (String name : List.of("gendox-assistant", "gendox-files", "gendox-desktop")) {
            when(skillRepository.findByNameAndLatestTrue(name)).thenReturn(Optional.of(version(name, 1, true, md(name, "d", "body"))));
        }
        Message prompt = new Message();
        prompt.setThreadId(UUID.randomUUID());
        prompt.getLocalContexts().add(context("GENDOX_PAGE"));
        prompt.getLocalContexts().add(context("GENDOX_DESKTOP"));
        when(messageLocalContextRepository.existsByMessage_ThreadIdAndDocumentIsNotNull(prompt.getThreadId())).thenReturn(true);
        assertEquals(List.of("gendox-assistant", "gendox-files", "gendox-desktop"),
                skillService.getCompletionSkills(agentId, prompt).stream().map(AgentSkill::getName).toList());
        Skill deleted = version("gendox-desktop", 1, true, md("gendox-desktop", "d", "body"));
        deleted.setDeleted(true);
        when(skillRepository.findByNameAndLatestTrue("gendox-desktop")).thenReturn(Optional.of(deleted));
        assertEquals(List.of("gendox-assistant", "gendox-files"),
                skillService.getCompletionSkills(agentId, prompt).stream().map(AgentSkill::getName).toList());
    }

    @Test
    void aSkillCanOnlyNameGendoxTools() throws GendoxException {
        when(aiToolRegistry.supports("list_tasks")).thenReturn(true);

        GendoxException unknown = assertThrows(GendoxException.class,
                () -> skillService.parse("---\nname: tasks\ndescription: d\nallowed-tools: list_tasks, made_up_tool\n---\n"));
        assertEquals("SKILL_UNKNOWN_TOOL", unknown.getErrorCode());

        GendoxException readSkill = assertThrows(GendoxException.class,
                () -> skillService.parse("---\nname: tasks\ndescription: d\nallowed-tools: read_skill\n---\n"));
        assertEquals("SKILL_UNKNOWN_TOOL", readSkill.getErrorCode());

        assertEquals(List.of("list_tasks"),
                skillService.parse("---\nname: tasks\ndescription: d\nallowed-tools: [list_tasks]\n---\n").tools());
    }

    @Test
    void aBrowserToolWithAToolExampleCanBeNamed() throws Exception {
        // open_web_page has no backend handler: the widget runs it
        when(typeService.getToolExampleDefinitions()).thenReturn(Map.of("open_web_page",
                JsonMapper.shared().readTree("{\"name\":\"open_web_page\",\"description\":\"Open a page\"}")));

        assertEquals(List.of("open_web_page"),
                skillService.parse("---\nname: nav\ndescription: d\nallowed-tools: open_web_page\n---\n").tools());
        assertEquals("Open a page", skillService.getSkillTools().get("open_web_page"));
    }

    @Test
    void aChatGetsReadSkillThenEverySkillsToolsSortedOnce() {
        AgentSkill a = AgentSkill.builder().name("a").description("d")
                .content("---\nname: a\ndescription: d\nallowed-tools: run_task list_tasks\n---\n").build();
        AgentSkill b = AgentSkill.builder().name("b").description("d")
                .content("---\nname: b\ndescription: d\nallowed-tools: get_task, list_tasks\n---\n").build();

        assertEquals(List.of("read_skill", "get_task", "list_tasks", "run_task"), skillService.chatToolNames(List.of(a, b)));
        assertEquals(List.of(), skillService.chatToolNames(List.of()));
    }

    @Test
    void importingANewSkillOnlyAddsItToTheLibrary() throws GendoxException {
        String file = md("gendox-assistant", "d", "body");
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.empty());
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> {
            Skill s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        skillService.importSystemSkill(file);

        verify(skillRepository).save(argThat(skill -> "gendox-assistant".equals(skill.getName()) && skill.getVersion() == 1));
        verifyNoInteractions(agentSkillRepository);
    }

    @Test
    void importingNeverOverwritesASuperAdminsVersionOrADeletedSkill() throws GendoxException {
        String file = md("gendox-assistant", "d", "new body");
        Skill adminEdit = version("gendox-assistant", 2, true, "admin edit");
        adminEdit.setCreatedBy(UUID.randomUUID());
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.of(adminEdit));
        skillService.importSystemSkill(file);

        Skill deleted = version("gendox-assistant", 2, true, "old");
        deleted.setDeleted(true);
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.of(deleted));
        skillService.importSystemSkill(file);

        verify(skillRepository, never()).save(any());
        verifyNoInteractions(agentSkillRepository);
    }

    @Test
    void importingAChangedFilePublishesANewVersion() throws GendoxException {
        String file = md("gendox-assistant", "d", "new body");
        Skill fromFile = version("gendox-assistant", 1, true, md("gendox-assistant", "d", "old body"));
        when(skillRepository.findByNameAndLatestTrue("gendox-assistant")).thenReturn(Optional.of(fromFile));
        when(skillRepository.save(any(Skill.class))).thenAnswer(inv -> inv.getArgument(0));
        when(skillRepository.findAllByNameOrderByVersionDesc("gendox-assistant")).thenReturn(List.of(fromFile));

        skillService.importSystemSkill(file);

        verify(agentSkillRepository).moveCopiesToVersion(any(), any(), eq("gendox-assistant"), eq("d"), eq(file));
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Skill;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillMarkdownParser;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectAgentServiceSkillsSyncTest {

    @Mock private SkillService skillService;

    private ProjectAgentService service;
    private ProjectAgent persisted;

    private static String md(String name, String body) {
        return "---\nname: " + name + "\ndescription: When " + name + ".\n---\n" + body;
    }

    private static AgentSkill copyOfSystemSkill(String name) {
        return AgentSkill.builder().id(UUID.randomUUID()).skillId(UUID.randomUUID())
                .name(name).description("d").content(md(name, "gendox")).build();
    }

    @BeforeEach
    void setUp() throws GendoxException {
        service = new ProjectAgentService(null, null, null, null, null, null, null, null, null, null, skillService);
        // the real parser; tool names are checked in SkillServiceTest
        lenient().when(skillService.parse(any())).thenAnswer(inv -> SkillMarkdownParser.parse(inv.getArgument(0)));
        persisted = new ProjectAgent();
        persisted.setAgentSkills(new ArrayList<>());
    }

    private ProjectAgent incoming(AgentSkill... skills) {
        ProjectAgent source = new ProjectAgent();
        source.setAgentSkills(new ArrayList<>(List.of(skills)));
        return source;
    }

    @Test
    void aNullListLeavesTheSkillsAlone() throws GendoxException {
        persisted.getAgentSkills().add(copyOfSystemSkill("gendox-assistant"));
        ProjectAgent source = new ProjectAgent();
        source.setAgentSkills(null);

        service.syncAgentSkills(source, persisted);

        assertEquals(1, persisted.getAgentSkills().size());
    }

    @Test
    void aMissingSkillIsRemoved() throws GendoxException {
        persisted.getAgentSkills().add(copyOfSystemSkill("gendox-assistant"));

        service.syncAgentSkills(incoming(), persisted);

        assertTrue(persisted.getAgentSkills().isEmpty());
    }

    @Test
    void aCopyOfAGendoxSkillCannotBeEdited() {
        AgentSkill copy = copyOfSystemSkill("gendox-assistant");
        persisted.getAgentSkills().add(copy);
        AgentSkill edited = copy.toBuilder().content(md("gendox-assistant", "my edit")).build();

        GendoxException e = assertThrows(GendoxException.class, () -> service.syncAgentSkills(incoming(edited), persisted));
        assertEquals("SKILL_READ_ONLY", e.getErrorCode());
    }

    @Test
    void anAddedGendoxSkillIsCopiedFromTheCatalogNotFromTheClient() throws GendoxException {
        Skill library = Skill.builder().id(UUID.randomUUID()).name("info-card").description("From Gendox.")
                .content(md("info-card", "the real body")).version(3).latest(true).deleted(false).build();
        when(skillService.getLibrarySkillById(library.getId())).thenReturn(library);

        AgentSkill fromClient = AgentSkill.builder().skillId(library.getId()).content(md("info-card", "tampered")).build();
        service.syncAgentSkills(incoming(fromClient), persisted);

        AgentSkill added = persisted.getAgentSkills().getFirst();
        assertEquals(library.getContent(), added.getContent());
        assertEquals(library.getId(), added.getSkillId());
        assertSame(persisted, added.getAgent());
    }

    @Test
    void anOwnSkillIsReadFromItsFrontMatter() throws GendoxException {
        AgentSkill own = AgentSkill.builder().id(UUID.randomUUID()).name("old").description("old").content(md("old", "")).build();
        persisted.getAgentSkills().add(own);

        AgentSkill edited = own.toBuilder().name("ignored").content(md("goodwill", "new body")).build();
        service.syncAgentSkills(incoming(edited), persisted);

        assertEquals("goodwill", own.getName());
        assertEquals("When goodwill.", own.getDescription());
        assertTrue(own.getContent().endsWith("new body"));
    }

    @Test
    void twoSkillsCannotShareAName() {
        persisted.getAgentSkills().add(copyOfSystemSkill("info-card"));
        AgentSkill existing = persisted.getAgentSkills().getFirst();
        AgentSkill duplicate = AgentSkill.builder().content(md("info-card", "mine")).build();

        GendoxException e = assertThrows(GendoxException.class,
                () -> service.syncAgentSkills(incoming(existing, duplicate), persisted));
        assertEquals("SKILL_NAME_DUPLICATE", e.getErrorCode());
    }
}

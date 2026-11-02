package dev.ctrlspace.gendox.gendoxcoreapi.services.skills;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SkillMarkdownParserTest {

    private static final String VALID = """
            ---
            name: hand-over-to-support
            description: Use when the customer is upset or asks for a person.
            ---

            # Hand over

            1. Say you'll pass it on.
            """;

    @Test
    void readsNameAndDescriptionAndKeepsTheWholeFile() throws GendoxException {
        SkillMarkdownParser.ParsedSkill parsed = SkillMarkdownParser.parse(VALID);

        assertEquals("hand-over-to-support", parsed.name());
        assertEquals("Use when the customer is upset or asks for a person.", parsed.description());
        assertEquals(VALID, parsed.content());
    }

    @Test
    void acceptsWindowsLineEndingsAndExtraKeys() throws GendoxException {
        String content = "---\r\nname: info-card\r\ndescription: \"Facts: at a glance\"\r\nlicense: MIT\r\n---\r\n# Body\r\n";

        SkillMarkdownParser.ParsedSkill parsed = SkillMarkdownParser.parse(content);

        assertEquals("info-card", parsed.name());
        assertEquals("Facts: at a glance", parsed.description());
    }

    @Test
    void rejectsAFileWithoutFrontMatter() {
        GendoxException e = assertThrows(GendoxException.class, () -> SkillMarkdownParser.parse("# Just markdown"));
        assertEquals("SKILL_FRONT_MATTER_MISSING", e.getErrorCode());
    }

    @Test
    void rejectsAMissingOrInvalidName() {
        GendoxException missing = assertThrows(GendoxException.class,
                () -> SkillMarkdownParser.parse("---\ndescription: x\n---\n"));
        assertEquals("SKILL_NAME_MISSING", missing.getErrorCode());

        GendoxException invalid = assertThrows(GendoxException.class,
                () -> SkillMarkdownParser.parse("---\nname: Hand Over\ndescription: x\n---\n"));
        assertEquals("SKILL_NAME_INVALID", invalid.getErrorCode());

        GendoxException tooLong = assertThrows(GendoxException.class,
                () -> SkillMarkdownParser.parse("---\nname: " + "a".repeat(65) + "\ndescription: x\n---\n"));
        assertEquals("SKILL_NAME_INVALID", tooLong.getErrorCode());
    }

    @Test
    void rejectsAMissingDescription() {
        GendoxException e = assertThrows(GendoxException.class,
                () -> SkillMarkdownParser.parse("---\nname: info-card\n---\n# Body"));
        assertEquals("SKILL_DESCRIPTION_MISSING", e.getErrorCode());
    }

    @Test
    void rejectsInvalidYamlAndOversizedFiles() {
        GendoxException yaml = assertThrows(GendoxException.class,
                () -> SkillMarkdownParser.parse("---\nname: [unclosed\n---\n"));
        assertEquals("SKILL_FRONT_MATTER_INVALID", yaml.getErrorCode());

        String huge = "---\nname: big\ndescription: x\n---\n" + "x".repeat(SkillMarkdownParser.MAX_CONTENT_LENGTH);
        GendoxException tooBig = assertThrows(GendoxException.class, () -> SkillMarkdownParser.parse(huge));
        assertEquals("SKILL_TOO_LONG", tooBig.getErrorCode());
    }

    @Test
    void readsAllowedToolsAsAListOrAString() throws GendoxException {
        assertEquals(java.util.List.of("list_tasks", "get_task"),
                SkillMarkdownParser.parse("---\nname: a\ndescription: d\nallowed-tools: list_tasks, get_task\n---\n").tools());
        assertEquals(java.util.List.of("list_tasks", "get_task"),
                SkillMarkdownParser.parse("---\nname: a\ndescription: d\nallowed-tools:\n  - list_tasks\n  - get_task\n---\n").tools());
        assertEquals(java.util.List.of(), SkillMarkdownParser.parse(VALID).tools());
        assertEquals(java.util.List.of(), SkillMarkdownParser.toolsOf("not a skill"));
    }

    @Test
    void theShippedSkillParsesAndBringsItsTools() throws Exception {
        var resources = new org.springframework.core.io.support.PathMatchingResourcePatternResolver()
                .getResources("classpath*:skills/*/SKILL.md");
        assertTrue(resources.length >= 1, "no SKILL.md on the classpath");
        SkillMarkdownParser.ParsedSkill assistant = SkillMarkdownParser.parse(
                resources[0].getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
        assertTrue(assistant.tools().containsAll(java.util.List.of("list_tasks", "read_task_result", "run_task", "advanced_search")));
    }
}

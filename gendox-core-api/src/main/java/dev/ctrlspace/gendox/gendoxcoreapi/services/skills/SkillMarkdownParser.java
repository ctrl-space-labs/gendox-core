package dev.ctrlspace.gendox.gendoxcoreapi.services.skills;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import org.springframework.http.HttpStatus;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Reads a SKILL.md in the Agent Skills format Claude Code and Codex use: YAML front matter between
 * {@code ---} lines with {@code name} and {@code description}, then Markdown. The frontend repeats
 * these rules for its live check, in {@code utils/skillMarkdown.js}.
 */
public final class SkillMarkdownParser {

    public static final int MAX_CONTENT_LENGTH = 50_000;
    public static final Pattern NAME_PATTERN = Pattern.compile("^[a-z0-9-]{1,64}$");
    private static final Pattern FRONT_MATTER =
            Pattern.compile("\\A\\uFEFF?\\s*---[ \\t]*\\r?\\n(.*?)\\r?\\n---[ \\t]*(\\r?\\n|\\z)", Pattern.DOTALL);

    /**
     * @param tools the built-in tools the skill brings, from {@code allowed-tools}: added to a chat
     *              completion while the skill is linked to the agent
     */
    public record ParsedSkill(String name, String description, List<String> tools, String content) {
    }

    private SkillMarkdownParser() {
    }

    public static ParsedSkill parse(String content) throws GendoxException {
        if (content == null || content.isBlank()) {
            throw invalid("SKILL_FRONT_MATTER_MISSING", "Start with front matter between --- lines");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw invalid("SKILL_TOO_LONG", "A skill can be at most " + MAX_CONTENT_LENGTH + " characters");
        }

        var matcher = FRONT_MATTER.matcher(content);
        if (!matcher.find()) {
            throw invalid("SKILL_FRONT_MATTER_MISSING", "Start with front matter between --- lines");
        }

        Map<?, ?> frontMatter;
        try {
            Object loaded = new Yaml(new SafeConstructor(new LoaderOptions())).load(matcher.group(1));
            frontMatter = loaded instanceof Map<?, ?> map ? map : Map.of();
        } catch (Exception e) {
            throw invalid("SKILL_FRONT_MATTER_INVALID", "The front matter is not valid YAML: " + e.getMessage());
        }

        String name = stringValue(frontMatter.get("name"));
        if (name == null || name.isBlank()) {
            throw invalid("SKILL_NAME_MISSING", "Add a name");
        }
        if (!NAME_PATTERN.matcher(name).matches()) {
            throw invalid("SKILL_NAME_INVALID", "The name takes lowercase letters, numbers and dashes, at most 64 characters");
        }

        String description = stringValue(frontMatter.get("description"));
        if (description == null || description.isBlank()) {
            throw invalid("SKILL_DESCRIPTION_MISSING", "Add a description: when should the agent use it?");
        }

        return new ParsedSkill(name, description.trim(), tools(frontMatter.get("allowed-tools")), content);
    }

    /**
     * The front matter of a skill exactly as written, between its {@code ---} lines (line endings
     * normalized to {@code \n}). Null when the content has none.
     */
    public static String frontMatterOf(String content) {
        if (content == null) {
            return null;
        }
        var matcher = FRONT_MATTER.matcher(content);
        if (!matcher.find()) {
            return null;
        }
        return "---\n" + matcher.group(1).replace("\r\n", "\n").strip() + "\n---";
    }

    /** The tools of an already-saved skill; an unreadable file brings none. */
    public static List<String> toolsOf(String content) {
        try {
            return parse(content).tools();
        } catch (GendoxException e) {
            return List.of();
        }
    }

    /** {@code allowed-tools} as a YAML list, or one string separated by commas or spaces. */
    private static List<String> tools(Object value) {
        Stream<String> names = value instanceof List<?> list
                ? list.stream().map(String::valueOf)
                : value == null ? Stream.empty() : Arrays.stream(value.toString().split("[,\\s]+"));
        return names.map(String::trim).filter(name -> !name.isEmpty()).distinct().toList();
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString().trim();
    }

    private static GendoxException invalid(String code, String message) {
        return new GendoxException(code, message, HttpStatus.BAD_REQUEST);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services.skills;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.skills.ReadSkillTool;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AgentSkill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Skill;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AgentSkillRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageLocalContextRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.SkillRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * The catalog of system (Gendox) skills, and the skills an agent's completions get.
 *
 * <p>A system skill is a set of rows sharing one name, one row per version. A project admin adds one
 * to an agent from the library, as a copy ({@link AgentSkill}); publishing a new version moves every
 * agent that still has the skill to it, and an agent that removed the skill is left without it.
 * {@link #ASSISTANT_SKILL} is never linked: a chat from a Gendox page gets it from the library.
 */
@Service
public class SkillService {

    private static final Logger logger = LoggerFactory.getLogger(SkillService.class);

    /** The local context the Gendox app's chat widget sends with every message. */
    public static final String GENDOX_PAGE_CONTEXT = "GENDOX_PAGE";
    /** The skill a chat from a Gendox page gets, whether or not the agent has it. */
    public static final String ASSISTANT_SKILL = "gendox-assistant";

    private final SkillRepository skillRepository;
    private final AgentSkillRepository agentSkillRepository;
    private final AiToolRegistry aiToolRegistry;
    private final MessageLocalContextRepository messageLocalContextRepository;

    // lazy: the tools reach ProjectAgentService, which needs this service
    public SkillService(SkillRepository skillRepository,
                        AgentSkillRepository agentSkillRepository,
                        @Lazy AiToolRegistry aiToolRegistry,
                        MessageLocalContextRepository messageLocalContextRepository) {
        this.skillRepository = skillRepository;
        this.agentSkillRepository = agentSkillRepository;
        this.aiToolRegistry = aiToolRegistry;
        this.messageLocalContextRepository = messageLocalContextRepository;
    }

    /** Reads a SKILL.md and checks that every tool in {@code allowed-tools} is a built-in Gendox tool. */
    public SkillMarkdownParser.ParsedSkill parse(String content) throws GendoxException {
        SkillMarkdownParser.ParsedSkill parsed = SkillMarkdownParser.parse(content);
        for (String tool : parsed.tools()) {
            if (ReadSkillTool.NAME.equals(tool) || !aiToolRegistry.supports(tool)) {
                throw new GendoxException("SKILL_UNKNOWN_TOOL",
                        "allowed-tools: " + tool + " is not a Gendox tool", HttpStatus.BAD_REQUEST);
            }
        }
        return parsed;
    }

    // ---------------------------------------------------------------- catalog

    /** The library: the latest version of every system skill that is not deleted. */
    public List<Skill> getLibrary() {
        return skillRepository.findAllByLatestTrueAndDeletedFalseOrderByNameAsc();
    }

    /** The latest version of a library skill, by name. Empty when there is none or it was deleted. */
    public Optional<Skill> getLibrarySkill(String name) {
        return skillRepository.findByNameAndLatestTrue(name)
                .filter(skill -> !Boolean.TRUE.equals(skill.getDeleted()));
    }

    public Skill getLibrarySkillById(UUID skillId) throws GendoxException {
        return skillRepository.findById(skillId)
                .filter(skill -> !Boolean.TRUE.equals(skill.getDeleted()))
                .orElseThrow(() -> new GendoxException("SKILL_NOT_FOUND", "Skill not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public Skill create(String content) throws GendoxException {
        SkillMarkdownParser.ParsedSkill parsed = parse(content);
        if (skillRepository.findByNameAndLatestTrue(parsed.name()).isPresent()) {
            throw new GendoxException("SKILL_ALREADY_EXISTS",
                    "A Gendox skill named " + parsed.name() + " already exists", HttpStatus.CONFLICT);
        }
        return skillRepository.save(Skill.builder()
                .name(parsed.name())
                .description(parsed.description())
                .content(content)
                .version(1)
                .latest(true)
                .deleted(false)
                .build());
    }

    /**
     * Publishes {@code content} as the next version of the system skill {@code name}, and moves
     * every agent that still has the skill to it. The name cannot change between versions: it is
     * what ties the versions of one skill together.
     */
    @Transactional
    public Skill publishNewVersion(String name, String content) throws GendoxException {
        SkillMarkdownParser.ParsedSkill parsed = parse(content);
        if (!parsed.name().equals(name)) {
            throw new GendoxException("SKILL_NAME_CHANGE_NOT_ALLOWED",
                    "A new version must keep the name " + name, HttpStatus.BAD_REQUEST);
        }

        Skill current = skillRepository.findByNameAndLatestTrue(name)
                .filter(skill -> !Boolean.TRUE.equals(skill.getDeleted()))
                .orElseThrow(() -> new GendoxException("SKILL_NOT_FOUND", "Skill not found: " + name, HttpStatus.NOT_FOUND));
        if (content.equals(current.getContent())) {
            return current;
        }

        current.setLatest(false);
        // flush first: the partial unique index allows one latest row per name
        skillRepository.saveAndFlush(current);

        Skill next = skillRepository.save(Skill.builder()
                .name(name)
                .description(parsed.description())
                .content(content)
                .version(current.getVersion() + 1)
                .latest(true)
                .deleted(false)
                .build());

        Set<UUID> allVersionIds = skillRepository.findAllByNameOrderByVersionDesc(name).stream()
                .map(Skill::getId)
                .collect(Collectors.toSet());
        int moved = agentSkillRepository.moveCopiesToVersion(allVersionIds, next.getId(),
                next.getName(), next.getDescription(), next.getContent());
        logger.info("Published skill {} v{}; {} agent(s) moved to it", name, next.getVersion(), moved);
        return next;
    }

    /** Hides the skill from the library. Agents keep their copies until an admin removes them. */
    @Transactional
    public void delete(String name) throws GendoxException {
        List<Skill> versions = skillRepository.findAllByNameOrderByVersionDesc(name);
        if (versions.isEmpty()) {
            throw new GendoxException("SKILL_NOT_FOUND", "Skill not found: " + name, HttpStatus.NOT_FOUND);
        }
        versions.forEach(v -> v.setDeleted(true));
        skillRepository.saveAll(versions);
    }

    /**
     * Imports a SKILL.md shipped with Gendox ({@code classpath:skills/<name>/SKILL.md}).
     * <ul>
     *   <li>New: created at version 1, in the library for project admins to add.</li>
     *   <li>Changed file: a new version, reaching the agents that still have the skill, but only while
     *       the latest version came from a file ({@code created_by} null). Once a super admin has
     *       published a version, the file no longer overwrites it.</li>
     *   <li>Deleted by an admin: left deleted.</li>
     * </ul>
     */
    @Transactional
    public void importSystemSkill(String content) throws GendoxException {
        String name = parse(content).name();
        Optional<Skill> latest = skillRepository.findByNameAndLatestTrue(name);

        if (latest.isEmpty()) {
            create(content);
            logger.info("Imported system skill {} v1", name);
            return;
        }

        Skill current = latest.get();
        if (Boolean.TRUE.equals(current.getDeleted()) || current.getCreatedBy() != null
                || content.equals(current.getContent())) {
            return;
        }
        Skill next = publishNewVersion(name, content);
        logger.info("Updated system skill {} to v{} from its file", name, next.getVersion());
    }

    // ---------------------------------------------------------------- the agent's view

    public List<AgentSkill> getAgentSkills(UUID agentId) {
        return agentSkillRepository.findAllByAgentIdOrderByNameAsc(agentId);
    }

    /**
     * The skills of a completion: the agent's own, plus {@link #ASSISTANT_SKILL} from the library when
     * the prompt came from a Gendox page ({@link #GENDOX_PAGE_CONTEXT}) and the agent doesn't have it.
     * That one is not stored on the agent; read_skill finds it in the library.
     */
    public List<AgentSkill> getCompletionSkills(UUID agentId, Message prompt) {
        List<AgentSkill> skills = new ArrayList<>(getAgentSkills(agentId));
        if (!fromGendoxPage(prompt) || skills.stream().anyMatch(s -> ASSISTANT_SKILL.equals(s.getName()))) {
            return skills;
        }
        getLibrarySkill(ASSISTANT_SKILL).ifPresent(skill -> skills.add(AgentSkill.builder()
                .skillId(skill.getId())
                .name(skill.getName())
                .description(skill.getDescription())
                .content(skill.getContent())
                .build()));
        return skills;
    }

    // the saved contexts when the prompt is stored (a job reads it back without them), else the ones on it
    private boolean fromGendoxPage(Message prompt) {
        if (prompt == null) {
            return false;
        }
        if (prompt.getId() != null) {
            return messageLocalContextRepository.existsByMessage_IdAndContextTypeName(prompt.getId(), GENDOX_PAGE_CONTEXT);
        }
        return prompt.getLocalContexts() != null && prompt.getLocalContexts().stream()
                .anyMatch(context -> GENDOX_PAGE_CONTEXT.equals(context.getContextTypeName()));
    }

    /**
     * The skills header, appended to the system prompt of the agent's completions (chats and task
     * runs): each skill's own front matter, as written in its SKILL.md, sorted by name. Built from
     * nothing but the skills, so the same skills always give the same bytes and the prompt prefix
     * stays cacheable across turns. Null when there are no skills.
     */
    public String buildSkillsHeader(List<AgentSkill> skills) {
        if (skills == null || skills.isEmpty()) {
            return null;
        }
        StringBuilder sb = new StringBuilder("## Skills\n\n");
        sb.append("Skills are instructions for specific situations. Below is the front matter of each skill: its name, when to use it, and the tools it uses.\n\n");
        skills.stream()
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(AgentSkill::getName))
                .forEach(s -> sb.append(frontMatter(s)).append("\n\n"));
        sb.append("Read a skill with ").append(ReadSkillTool.NAME).append("(name) before you follow it.");
        return sb.toString();
    }

    // a saved skill always has front matter; the fallback only guards against a broken row
    private static String frontMatter(AgentSkill skill) {
        String frontMatter = SkillMarkdownParser.frontMatterOf(skill.getContent());
        return frontMatter != null ? frontMatter
                : "---\nname: " + skill.getName() + "\ndescription: " + skill.getDescription() + "\n---";
    }

    /**
     * The tools a completion adds for the agent's skills: read_skill, then every tool the
     * skills list in {@code allowed-tools}, sorted so the request stays the same turn after turn.
     */
    public List<String> chatToolNames(List<AgentSkill> skills) {
        if (skills == null || skills.isEmpty()) {
            return List.of();
        }
        TreeSet<String> skillTools = skills.stream()
                .flatMap(skill -> SkillMarkdownParser.toolsOf(skill.getContent()).stream())
                .collect(Collectors.toCollection(TreeSet::new));
        List<String> names = new ArrayList<>();
        names.add(ReadSkillTool.NAME);
        names.addAll(skillTools);
        return names;
    }
}

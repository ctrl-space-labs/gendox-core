package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.skills.ReadSkillTool;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Skill;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.SkillContentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * The catalog of Gendox (system) skills. Any signed-in user can read the library, to add a skill
 * to an agent; only super admins change it. An agent's own skills are saved with the agent, like
 * its tools, through {@code PUT /organizations/{organizationId}/projects/{projectId}}.
 */
@RestController
public class SkillController {

    private final SkillService skillService;
    private final AiToolRegistry aiToolRegistry;

    public SkillController(SkillService skillService, AiToolRegistry aiToolRegistry) {
        this.skillService = skillService;
        this.aiToolRegistry = aiToolRegistry;
    }

    @GetMapping("/skills")
    @Operation(summary = "List the Gendox skills",
            description = "The latest version of every Gendox skill, to add to an agent.")
    public List<Skill> getLibrary() {
        return skillService.getLibrary();
    }

    @GetMapping("/skills/tools")
    @Operation(summary = "List the tools a skill can bring",
            description = "The built-in Gendox tools a SKILL.md may name in allowed-tools.")
    public List<SkillToolDTO> getSkillTools() {
        return aiToolRegistry.getHandlers().stream()
                .filter(handler -> !ReadSkillTool.NAME.equals(handler.getName()))
                .map(handler -> new SkillToolDTO(handler.getName(), handler.getDescription()))
                .toList();
    }

    public record SkillToolDTO(String name, String description) {
    }

    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @PostMapping("/skills")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a Gendox skill",
            description = "Creates version 1 from a SKILL.md. New agents get it; existing agents can add it from the library.")
    public Skill create(@RequestBody SkillContentDTO body) throws GendoxException {
        return skillService.create(body.getContent());
    }

    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @PutMapping("/skills/{name}")
    @Operation(summary = "Publish a new version of a Gendox skill",
            description = "Every agent that has the skill moves to the new version. Agents that removed it are not given it again.")
    public Skill publishNewVersion(@PathVariable String name, @RequestBody SkillContentDTO body) throws GendoxException {
        return skillService.publishNewVersion(name, body.getContent());
    }

    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @DeleteMapping("/skills/{name}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a Gendox skill",
            description = "Removes it from the library. Agents keep their copies until a project admin removes them.")
    public void delete(@PathVariable String name) throws GendoxException {
        skillService.delete(name);
    }
}

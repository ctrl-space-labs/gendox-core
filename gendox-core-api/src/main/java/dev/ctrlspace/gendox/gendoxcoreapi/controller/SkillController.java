package dev.ctrlspace.gendox.gendoxcoreapi.controller;

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

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping("/skills")
    @Operation(summary = "List the Gendox skills",
            description = "The latest version of every Gendox skill, to add to an agent.")
    public List<Skill> getLibrary() {
        return skillService.getLibrary();
    }

    @GetMapping("/skills/tools")
    @Operation(summary = "List the tools a skill can bring",
            description = "The Gendox tools a SKILL.md may name in allowed-tools: built-in tools and tool examples.")
    public List<SkillToolDTO> getSkillTools() {
        return skillService.getSkillTools().entrySet().stream()
                .map(tool -> new SkillToolDTO(tool.getKey(), tool.getValue()))
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

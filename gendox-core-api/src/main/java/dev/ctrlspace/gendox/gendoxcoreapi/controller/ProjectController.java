package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectMemberConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectMember;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectMemberDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectMemberCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectMemberService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
public class ProjectController {

    private ProjectService projectService;

    private ProjectConverter projectConverter;
    private ProjectMemberService projectMemberService;
    private JWTUtils jwtUtils;
    private ProjectMemberConverter projectMemberConverter;

    @Autowired
    public ProjectController(ProjectService projectService,
                             ProjectConverter projectConverter,
                             ProjectMemberService projectMemberService,
                             JWTUtils jwtUtils,
                             ProjectMemberConverter projectMemberConverter) {
        this.projectService = projectService;
        this.projectConverter = projectConverter;
        this.projectMemberService = projectMemberService;
        this.jwtUtils = jwtUtils;
        this.projectMemberConverter = projectMemberConverter;
    }


    //        @PreAuthorize("@securityUtils.hasAuthorityToRequestedProjectId('id')")
    @GetMapping("/projects/{id}")
    public Project getProjectById(@PathVariable UUID id) throws GendoxException {
        return projectService.getProjectById(id);
    }


    //        @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT') " +
//            "|| @securityUtils.hasAuthorityToAllRequestedProjectId()")
    @GetMapping("/projects")
    public Page<Project> getAllProjects(@Valid ProjectCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return projectService.getAllProjects(criteria, pageable);
    }

    // TODO: preauthorize has OP_CREATE_PROJECT for the requested organization
    @PostMapping(value = "/projects", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public Project createProject(@RequestBody ProjectDTO projectDTO) throws Exception {

//        throw new UnsupportedOperationException("Not implemented yet");

        Project project = projectConverter.toEntity(projectDTO);
        project = projectService.createProject(project);

        return project;
    }


    // TODO: preauthorize has OP_UPDATE_PROJECT for the requested organization
    // TODO: is member to the project
    @Operation(summary = "Update a project by id",
            //as technical writer add description by the above and below TODOs
            description = """
                    Update a project by id. The user has to be member of the project and had permission to update the project.
                    The organization id can't be changed once the project has been created.
                    Project agents will be updated in this endpoint.
                    Project members will be updated to the /projects/{id}/members endpoint (Get all by project id, add user, remove user)
                    """)
    @PutMapping("/projects/{id}")
    public Project updateProject(@PathVariable UUID id, @RequestBody ProjectDTO projectDTO) throws GendoxException {

//        throw new UnsupportedOperationException("Not implemented yet");


        Project project = new Project();
        project = projectConverter.toEntity(projectDTO);


        if (!id.equals(projectDTO.getId())) {
            throw new GendoxException("PROJECT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        project = projectService.updateProject(project);

        return project;

    }


    // TODO: preauthorize has OP_DELETE_PROJECT for the requested organization
    // TODO: is member to the project
    @DeleteMapping("/projects/{id}")
    public void delete(@PathVariable UUID id) throws Exception {
//        throw new UnsupportedOperationException("Not implemented yet");
        projectService.deleteProject(id);
    }


    // TODO validate that the user has permission to add a member to the project in the {{userMember}} object
    // TODO validate that the role level is not higher than the user's role level for this project
    @GetMapping(value = "/projects/{id}/users")
    public List<ProjectMember> getAllProjectMembers(@PathVariable UUID id, Authentication authentication, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        //run code to get the user from the database
        List<ProjectMember> projectUsers = projectMemberService.getAll(ProjectMemberCriteria
                .builder()
                .projectId(id.toString())
                .build());


        return projectUsers;
    }

    // didn't work
    @PostMapping(value = "/projects/{id}/users", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public ProjectMember addMemberToProject(@PathVariable UUID id, @RequestBody ProjectMemberDTO projectMemberDTO, Authentication authentication) throws Exception {

        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        ProjectMember projectMember = projectMemberConverter.toEntity(projectMemberDTO);
        projectMember = projectMemberService.createProjectMember(projectMember.getUser().getId(), id);

        return projectMember;

    }

    @PostMapping(value = "/projects/{projectId}/users/{userId}")
    public ProjectMember addMemberToProject(@PathVariable UUID projectId, @PathVariable UUID userId, Authentication authentication) throws Exception {

        JwtDTO jwtDTO = jwtUtils.toJwtDTO((Jwt) authentication.getPrincipal());

        ProjectMember projectMember = projectMemberService.createProjectMember(userId, projectId);

        return projectMember;


    }

    @DeleteMapping("/projects/{projectId}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMemberFromProject(@PathVariable UUID projectId, @PathVariable UUID userId) throws Exception {
        projectMemberService.removeMemberFromProject(projectId, userId);
    }

}













package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.ProjectMemberConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectMemberDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectMemberCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.AiModelConstants;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ProjectController {

    private ProjectService projectService;
    private ProjectConverter projectConverter;
    private ProjectMemberService projectMemberService;
    private ProjectMemberConverter projectMemberConverter;
    private ProjectAgentService projectAgentService;

    private SecurityUtils securityUtils;

    private UserService userService;


    @Autowired
    public ProjectController(ProjectService projectService,
                             ProjectConverter projectConverter,
                             ProjectMemberService projectMemberService,
                             ProjectMemberConverter projectMemberConverter,
                             ProjectAgentService projectAgentService,
                             SecurityUtils securityUtils,
                             UserService userService) {
        this.projectService = projectService;
        this.projectConverter = projectConverter;
        this.projectMemberService = projectMemberService;
        this.projectMemberConverter = projectMemberConverter;
        this.projectAgentService = projectAgentService;
        this.securityUtils = securityUtils;
        this.userService = userService;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}")
    @Operation(summary = "Get project by ID",
            description = "Retrieve project details by its unique ID. The user must have the appropriate permissions to access this project.")

    public Project getProjectById(@PathVariable UUID projectId) throws GendoxException {
        return projectService.getProjectById(projectId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable') " +
            "|| @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectsFromRequestParams')")
    @GetMapping("organizations/{organizationId}/projects")
    @Operation(summary = "Get all projects",
            description = "Retrieve a list of all projects based on the provided criteria. The user must have the necessary permissions to access these projects.")

    public Page<Project> getAllProjects(@Valid ProjectCriteria criteria, @PathVariable("organizationId") String organizationId, Pageable pageable) throws GendoxException {
        // override requested org id with the path variable
        criteria.setOrganizationId(organizationId);
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        return projectService.getAllProjects(criteria, pageable);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_CREATE_PROJECT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping(value = "organizations/{organizationId}/projects", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create a new project",
            description = "Create a new project for the organization. " +
                    "The user must have the necessary permissions to create projects for the organization. " +
                    "This endpoint accepts a JSON payload describing the project details.")
    public Project createProject(@PathVariable UUID organizationId, @RequestBody ProjectDTO projectDTO) throws Exception {

        if (projectDTO.getId() != null) {
            throw new GendoxException("PROJECT_ID_MUST_BE_NULL", "Project id is not null", HttpStatus.BAD_REQUEST);
        }

        if (!organizationId.equals(projectDTO.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization ID in path and Organization ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String creatorUserId = ((UserProfile) authentication.getPrincipal()).getId();
        userService.evictUserProfileByUniqueIdentifier(securityUtils.getUserIdentifier());

        Project project = projectService.createProject(projectDTO, creatorUserId);

        return project;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @Operation(summary = "Update a project by id",
            //as technical writer add description by the above and below TODOs
            description = """
                    Update a project by id. The user has to be member of the project and had permission to update the project.
                    The organization id can't be changed once the project has been created.
                    Project agents will be updated in this endpoint.
                    Project members will be updated to the /projects/{id}/members endpoint (Get all by project id, add user, remove user)
                    """)
    @PutMapping("organizations/{organizationId}/projects/{projectId}")
    public Project updateProject(@PathVariable UUID projectId, @PathVariable UUID organizationId, @RequestBody ProjectDTO projectDTO) throws GendoxException {

        Project project = new Project();
        project = projectConverter.toEntity(projectDTO);


        if (!projectId.equals(projectDTO.getId())) {
            throw new GendoxException("PROJECT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        if (!organizationId.equals(projectDTO.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization ID in path and Organization ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        UUID updatedprojectId = project.getId();
        Project existingProject = this.getProjectById(updatedprojectId);

        // Update the properties of the existingProject with the values from the updated project
        existingProject.setName(project.getName());
        existingProject.setDescription(project.getDescription());
        existingProject.setProjectAgent(projectAgentService.updateProjectAgent(project.getProjectAgent()));
        existingProject.setAutoTraining(project.getAutoTraining());
        project = projectService.updateProject(existingProject);

        return project;

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_DELETE_PROJECT', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping("organizations/{organizationId}/projects/{projectId}")
    @Operation(summary = "Delete project by ID",
            description = "Delete a project by its unique ID. To perform this operation, " +
                    "the user must have the necessary permissions to delete the specified project.")
    public void delete(@PathVariable UUID projectId) throws Exception {
        projectService.deleteProject(projectId);
    }


    // TODO validate that the role level is not higher than the user's role level for this project
    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping(value = "organizations/{organizationId}/projects/{projectId}/users")
    @Operation(summary = "Get all project members",
            description = "Retrieve a list of all members associated with a project by its unique ID. " +
                    "The user must have the necessary permissions to access these project members. Additionally, " +
                    "the system should validate that the requesting user has the required permissions " +
                    "and that the role level is appropriate for accessing the project members.")
    public List<ProjectMember> getAllProjectMembers(@PathVariable UUID projectId, Authentication authentication, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        //run code to get the user from the database
        List<ProjectMember> projectUsers = projectMemberService.getAll(ProjectMemberCriteria
                .builder()
                .projectId(projectId.toString())
                .build());


        return projectUsers;
    }

    // didn't work
    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_PROJECT_MEMBERS', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "organizations/{organizationId}/projects/{projectId}/users", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Add a member to a project",
            description = "Add a new member to a project by specifying the project ID. The user must have the necessary permissions to add members to this project.")
    public ProjectMember addMemberToProject(@PathVariable UUID projectId, @RequestBody ProjectMemberDTO projectMemberDTO) throws Exception {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User invitedUser = userService.getById(projectMemberDTO.getUser().getId());
        userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));

        ProjectMember projectMember = projectMemberConverter.toEntity(projectMemberDTO);
        projectMember = projectMemberService.createProjectMember(projectMember.getUser().getId(), projectId);

        return projectMember;

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_PROJECT_MEMBERS', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "organizations/{organizationId}/projects/{projectId}/users/{userId}")
    @Operation(summary = "Add a member to a project",
            description = "Add a new member to a project by specifying both the project ID and the user ID. " +
                    "The user must have the necessary permissions to add members to this project. " +
                    "This method handles the addition of a user as a member to a project and returns the created ProjectMember entity.")
    public ProjectMember addMemberToProject(@PathVariable UUID projectId, @PathVariable UUID userId) throws Exception {

        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        User invitedUser = userService.getById(userId);
        userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));

        ProjectMember projectMember = projectMemberService.createProjectMember(userId, projectId);

        return projectMember;


    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_PROJECT_MEMBERS', 'getRequestedProjectIdFromPathVariable')")
    @PostMapping(value = "organizations/{organizationId}/projects/{projectId}/members")
    @Operation(summary = "Add members to a project",
            description = "Add new members to a project by specifying both the project ID and users ID. " +
                    "The user must have the necessary permissions to add members to this project. " +
                    "This method handles the addition of a user as a member to a project and returns the created ProjectMember entity.")
    public List<ProjectMember> addMembersToProject(@PathVariable UUID projectId, @RequestBody List<UUID> userIds) throws Exception {

        if (userIds.size() > 1000) {
            throw new GendoxException("MAX_USERS_EXCEED", "Number of users can't be more than 1000", HttpStatus.BAD_REQUEST);
        }

        List<ProjectMember> projectMembers = new ArrayList<>();
        GendoxAuthenticationToken authentication = (GendoxAuthenticationToken) SecurityContextHolder.getContext().getAuthentication();

        Pageable pageable = PageRequest.of(0, userIds.size());
        Page<User> invitedUsers = userService.getAllUsers(UserCriteria
                        .builder()
                        .usersIds(userIds)
                        .build(),
                pageable);
        invitedUsers.forEach(invitedUser -> {
            userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));
        });
        projectMembers = projectMemberService.createProjectMembers(projectId, userIds);

        return projectMembers;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_REMOVE_PROJECT_MEMBERS', 'getRequestedProjectIdFromPathVariable')")
    @DeleteMapping("organizations/{organizationId}/projects/{projectId}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove a member from a project",
            description = "Remove a member from a project by specifying both the project ID and the user ID. " +
                    "The user must have the necessary permissions to remove members from this project.")
    public void removeMemberFromProject(@PathVariable UUID projectId, @PathVariable UUID userId) throws Exception {
        User invitedUser = userService.getById(userId);
        userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));

        projectMemberService.removeMemberFromProject(projectId, userId);
    }







}















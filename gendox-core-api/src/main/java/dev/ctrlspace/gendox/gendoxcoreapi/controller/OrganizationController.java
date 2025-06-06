package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UpdateUserRoleRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.OrganizationRoleUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.UserNamesConstants;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.UUID;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private UserOrganizationService userOrganizationService;
    private OrganizationConverter organizationConverter;
    private UserService userService;
    private SecurityUtils securityUtils;
    private ProjectMemberService projectMemberService;


    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  UserOrganizationService userOrganizationService,
                                  OrganizationConverter organizationConverter,
                                  UserService userService,
                                  SecurityUtils securityUtils,
                                  ProjectMemberService projectMemberService
    ) {
        this.organizationService = organizationService;
        this.organizationConverter = organizationConverter;
        this.userOrganizationService = userOrganizationService;
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.projectMemberService = projectMemberService;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgsFromRequestParams')")
    @GetMapping("/organizations")
    @Operation(summary = "Get all organizations",
            description = "Retrieve a list of all organizations based on the provided criteria.")
    @Observed(name = "OrganizationController.getAllOrganizations",
            contextualName = "OrganizationController#getAllOrganizations",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Page<Organization> getAllOrganizations(@Valid OrganizationCriteria criteria, Pageable pageable) throws Exception {

        //run code to get the organization from database
        return organizationService.getAllOrganizations(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}")
    @Operation(summary = "Get organization by ID",
            description = "Retrieve an organization by its unique ID.")
    @Observed(name = "OrganizationController.getOrganizationById",
            contextualName = "OrganizationController#getOrganizationById",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Organization getOrganizationById(@PathVariable UUID organizationId, Authentication authentication) throws Exception {


        //run code to get the organization from the database
        Organization organization = organizationService.getById(organizationId);
        return organization;
    }

    @PostMapping(value = "/organizations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create organization",
            description = "Create a new organization based on the provided organization details.")
    @Observed(name = "OrganizationController.createOrganization",
            contextualName = "OrganizationController#createOrganization",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Organization createOrganization(@RequestBody OrganizationDTO organizationDTO) throws Exception {

        if (organizationDTO.getId() != null) {
            throw new GendoxException("ORGANIZATION_ID_MUST_BE_NULL", "Organization id is not null", HttpStatus.BAD_REQUEST);
        }
        Organization organization = organizationConverter.toEntity(organizationDTO);


        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String ownerUserId = ((UserProfile) authentication.getPrincipal()).getId();
        userService.evictUserProfileByUniqueIdentifier(securityUtils.getUserIdentifier());

        organization = organizationService.createOrganization(organization, UUID.fromString(ownerUserId));


        return organization;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}")
    @Operation(summary = "Update organization by ID",
            description = "Update an existing organization by specifying its unique ID and providing updated organization details.")
    @Observed(name = "OrganizationController.updateOrganization",
            contextualName = "OrganizationController#updateOrganization",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public Organization updateOrganization(@PathVariable UUID organizationId, @RequestBody OrganizationDTO organizationDTO) throws Exception {
        UUID updatedOrganizationId = organizationDTO.getId();
        Organization organization = new Organization();
        organization = organizationConverter.toEntity(organizationDTO);
        organization.setId(updatedOrganizationId);


        if (!organizationId.equals(organizationDTO.getId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        organization = organizationService.updateOrganization(organization);
        userService.evictUserProfileByUniqueIdentifier(securityUtils.getUserIdentifier());

        return organization;

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_DELETE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/deactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deactivate organization by ID",
            description = "Deactivate an existing organization and its projects by specifying its unique ID.")
    @Observed(name = "OrganizationController.deleteOrganization",
            contextualName = "OrganizationController#deleteOrganization",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public void deactivateOrganization(@PathVariable UUID organizationId) throws Exception {
        organizationService.deactivateOrganization(organizationId);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        userService.evictUserProfileByUniqueIdentifier(securityUtils.getUserIdentifier());

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/users")
    @Operation(summary = "Get users in organization by organization ID",
            description = "Retrieve a list of users who are members of a specific organization, identified by the provided organization ID. " +
                    "The organization's members are returned with details such as their roles and permissions within the organization. " +
                    "The results can be paginated for large organizations to ensure efficient data retrieval.")
    public List<UserOrganization> getUsersInOrganizationByOrgId(@PathVariable UUID organizationId, Authentication authentication, Pageable pageable) throws GendoxException {

        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        //run code to get the organization from the database
        List<UserOrganization> organizationUsers = userOrganizationService.getAll(UserOrganizationCriteria
                .builder()
                .organizationId(organizationId.toString())
                .build());
        return organizationUsers;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_USERS', 'getRequestedOrgIdFromPathVariable')")
    @Operation(summary = "Create a User - Organization association",
            description = """
                    Create a User - Organization association, if the user has right to add a user to the organization.
                    Users can give the maximum role they have in the organization.
                    The only requered field is the {user.id, organization.id role.name}
                    All the other fields will be ignored.
                    """)
    @PostMapping(value = "/organizations/{organizationId}/users", consumes = {"application/json"})
    @Observed(name = "OrganizationController.addUserToOrganization",
            contextualName = "OrganizationController#addUserToOrganization",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public UserOrganization addUserToOrganization(@PathVariable UUID organizationId, @RequestBody UserOrganizationDTO userOrganizationDTO) throws Exception {

        return userOrganizationService.addUserToOrganization(organizationId, userOrganizationDTO);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}/users/{userId}/roles")
    @Operation(summary = "Update user role in organization",
            description = "Update a user's role in an organization by specifying the user's unique ID, the organization's unique ID, and the new role name.")
    public UserOrganization updateUserRoleInOrganization(@PathVariable UUID organizationId,
                                                         @PathVariable UUID userId,
                                                         @RequestBody UpdateUserRoleRequestDTO request) throws GendoxException {
        // Retrieve the current user's profile from the security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserProfile currentUserProfile = (UserProfile) authentication.getPrincipal();

        String requesterOrganizationRole = userOrganizationService.getUserOrganizationRoleType(UUID.fromString(currentUserProfile.getId()), organizationId).getName();
        String targetOrganizationRole = userOrganizationService.getUserOrganizationRoleType(userId, organizationId).getName();

        if (!OrganizationRoleUtils.canChangeRole(requesterOrganizationRole, targetOrganizationRole)) {
            throw new GendoxException("USER_ROLE_CHANGE_NOT_ALLOWED", "You cannot change the role of this user", HttpStatus.BAD_REQUEST);
        }
        if (!OrganizationRoleUtils.canChangeRole(requesterOrganizationRole, request.getRoleName())) {
            throw new GendoxException("USER_ROLE_CHANGE_NOT_ALLOWED", "You cannot change the role of this user", HttpStatus.BAD_REQUEST );
        }


        return userOrganizationService.updateUserRole(request.getUserOrganizationId(), request.getRoleName());

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_REMOVE_PROJECT_MEMBERS', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove user from organization",
            description = "Remove a user from an organization by specifying the user's unique ID and the organization's unique ID.")
    public void removeUserFromOrganization(@PathVariable UUID organizationId, @PathVariable UUID userId) throws Exception {
        User user = userService.getById(userId);
        if (user.getUserType().getName().equals(UserNamesConstants.GENDOX_AGENT)) {
            throw new GendoxException("USER_REMOVE_NOT_ALLOWED", "You cannot remove this user from the organization", HttpStatus.BAD_REQUEST);
        }
        userOrganizationService.deleteUserOrganization(userId, organizationId);
        List<ProjectMember> projectMembers = projectMemberService.getProjectMembersByUserAndOrganization(userId, organizationId);
        projectMemberService.deleteProjectMembers(projectMembers);

    }


}

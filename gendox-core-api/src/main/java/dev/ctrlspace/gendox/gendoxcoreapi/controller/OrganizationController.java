package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.OrganizationUserDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EventPayloadDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UpdateUserRoleRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectMemberService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;
import java.util.UUID;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private UserOrganizationService userOrganizationService;
    private OrganizationConverter organizationConverter;
    private JWTUtils jwtUtils;
    private UserService userService;
    private SecurityUtils securityUtils;
    private ProjectMemberService projectMemberService;


    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  JWTUtils jwtUtils,
                                  UserOrganizationService userOrganizationService,
                                  OrganizationConverter organizationConverter,
                                  UserService userService,
                                  SecurityUtils securityUtils,
                                  ProjectMemberService projectMemberService) {
        this.organizationService = organizationService;
        this.organizationConverter = organizationConverter;
        this.userOrganizationService = userOrganizationService;
        this.jwtUtils = jwtUtils;
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

        return organization;

    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_DELETE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete organization by ID",
            description = "Delete an existing organization by specifying its unique ID.")
    @Observed(name = "OrganizationController.deleteOrganization",
            contextualName = "OrganizationController#deleteOrganization",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    public void deleteOrganization(@PathVariable UUID organizationId) throws Exception {
        organizationService.deleteOrganization(organizationId);
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

        if (!organizationId.equals(userOrganizationDTO.getOrganization().getId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserProfile userProfile = (UserProfile) authentication.getPrincipal();

        // Fetch the organizationUserDTO from the user's profile
        OrganizationUserDTO organizationUserDTO = userProfile.getOrganizations().stream()
                .filter(org -> org.getId().equals(organizationId.toString()))
                .findFirst()
                .orElseThrow(() -> new GendoxException("USER_NOT_IN_ORGANIZATION", "User is not in the organization", HttpStatus.BAD_REQUEST));

        // Retrieve the user's role from their authorities
        String invitingUserRole = organizationUserDTO.getAuthorities().stream()
                .filter(auth -> auth.startsWith("ROLE_"))
                .findFirst()
                .orElseThrow(() -> new GendoxException("USER_ROLE_NOT_FOUND", "User's role not found", HttpStatus.BAD_REQUEST));


        User invitedUser = userService.getById(userOrganizationDTO.getUser().getId());

        int invitingUserRoleLevel = userService.getUserOrganizationRoleLevel(invitingUserRole);
        int invitedUserRoleLevel = userService.getUserOrganizationRoleLevel(userOrganizationDTO.getRole().getName());

        if (invitedUserRoleLevel > invitingUserRoleLevel) {
            throw new GendoxException("INSUFFICIENT_ROLE", "You cannot assign a role higher than your own", HttpStatus.FORBIDDEN);
        }

        userService.evictUserProfileByUniqueIdentifier(userService.getUserIdentifier(invitedUser));

        return userOrganizationService.createUserOrganization(
                userOrganizationDTO.getUser().getId(),
                userOrganizationDTO.getOrganization().getId(),
                userOrganizationDTO.getRole().getName());

    }

    // TODO add preauthorize to update user role in organization

    @PutMapping("/organizations/{organizationId}/users/{userId}/roles")
    @Operation(summary = "Update user role in organization",
            description = "Update a user's role in an organization by specifying the user's unique ID, the organization's unique ID, and the new role name.")
    public UserOrganization updateUserRoleInOrganization(@RequestBody UpdateUserRoleRequestDTO request) throws Exception {
        return userOrganizationService.updateUserRole(request.getUserOrganizationId(), request.getRoleName());

    }

    // TODO add preauthorize to remove user from organization

    @DeleteMapping("/organizations/{organizationId}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove user from organization",
            description = "Remove a user from an organization by specifying the user's unique ID and the organization's unique ID.")
    public void removeUserFromOrganization(@PathVariable UUID organizationId, @PathVariable UUID userId) throws Exception {
        userOrganizationService.deleteUserOrganization(userId, organizationId);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.JwtDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.UserOrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.UserOrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.UUID;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private UserOrganizationService userOrganizationService;
    private OrganizationConverter organizationConverter;
    private JWTUtils jwtUtils;


    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  JWTUtils jwtUtils,
                                  UserOrganizationService userOrganizationService,
                                  OrganizationConverter organizationConverter) {
        this.organizationService = organizationService;
        this.organizationConverter = organizationConverter;
        this.userOrganizationService = userOrganizationService;
        this.jwtUtils = jwtUtils;

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgsFromRequestParams')")
    @GetMapping("/organizations")
    @Operation(summary = "Get all organizations",
            description = "Retrieve a list of all organizations based on the provided criteria.")
    public Page<Organization> getAllOrganizations(@Valid OrganizationCriteria criteria, Pageable pageable) throws Exception {

        //run code to get the organization from database
        return organizationService.getAllOrganizations(criteria, pageable);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}")
    @Operation(summary = "Get organization by ID",
            description = "Retrieve an organization by its unique ID.")
    public Organization getOrganizationById(@PathVariable UUID organizationId, Authentication authentication) throws Exception {

        //run code to get the organization from the database
        Organization organization = organizationService.getById(organizationId);
        return organization;
    }

    @PostMapping(value = "/organizations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    @Operation(summary = "Create organization",
            description = "Create a new organization based on the provided organization details.")
    public Organization createOrganization(@RequestBody OrganizationDTO organizationDTO) throws Exception {

        if (organizationDTO.getId() != null) {
            throw new GendoxException("ORGANIZATION_ID_MUST_BE_NULL", "Organization id is not null", HttpStatus.BAD_REQUEST);
        }
        Organization organization = organizationConverter.toEntity(organizationDTO);
        organization = organizationService.createOrganization(organization);


        return organization;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_ORGANIZATION', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/organizations/{organizationId}")
    @Operation(summary = "Update organization by ID",
            description = "Update an existing organization by specifying its unique ID and providing updated organization details.")
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


    //TODO validate that the role level is not higher than the user's role level for this organization

    @PreAuthorize("@securityUtils.hasAuthority('OP_ADD_USERS', 'getRequestedOrgIdFromPathVariable')")
    @Operation(summary = "Create a User - Organization association",
            description = """
                    Create a User - Organization association, if the user has right to add a user to the organization.
                    Users can give the maximum role they have in the organization.
                    The only requered field is the {user.id, organization.id role.name}
                    All the other fields will be ignored.
                    """)
    @PostMapping(value = "/organizations/{organizationId}/users", consumes = {"application/json"})
    public UserOrganization addUserToOrganization(@PathVariable UUID organizationId, @RequestBody UserOrganizationDTO userOrganizationDTO) throws Exception {

        if (!organizationId.equals(userOrganizationDTO.getOrganization().getId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        return userOrganizationService.createUserOrganization(
                userOrganizationDTO.getUser().getId(),
                userOrganizationDTO.getOrganization().getId(),
                userOrganizationDTO.getRole().getName());

    }


}

package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserOrganizationService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.QueryParamNames;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.LoggerFactory;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.UUID;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private JwtEncoder jwtEncoder;
    private OrganizationConverter organizationConverter;


    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  JwtEncoder jwtEncoder,
                                  OrganizationConverter organizationConverter) {
        this.organizationService = organizationService;
        this.jwtEncoder = jwtEncoder;
        this.organizationConverter = organizationConverter;

    }


    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT')")
    @GetMapping("/organizations")
    public Page<Organization> getAllOrganizations(@Valid OrganizationCriteria critetia, Pageable pageable) throws Exception {

        //run code to get the organization from database
        return organizationService.getAllOrganizations(critetia, pageable);
    }

    @GetMapping("/organizations/{id}")
    public Organization getOrganizationById(@PathVariable UUID id, Authentication authentication) throws Exception {

        //run code to get the organization from the database
        Organization organization = organizationService.getById(id);
        return organization;
    }

    @PostMapping(value = "/organizations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public Organization createOrganization(@RequestBody OrganizationDTO organizationDTO) throws Exception {
        Organization organization = organizationConverter.toEntity(organizationDTO);
        organization = organizationService.createOrganization(organization);


        return organization;
    }



    // TODO: Has Permission OP_UPDATE_ORGANIZATION

//    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_DELETE_ORGANIZATION')")
    @PutMapping("/organizations/{id}")
    public Organization updateOrganization(@PathVariable UUID id, @RequestBody OrganizationDTO organizationDTO) throws Exception {
        UUID organizationId = organizationDTO.getId();
        Organization organization = new Organization();
        organization = organizationConverter.toEntity(organizationDTO);
        organization.setId(organizationId);


        if (!id.equals(organizationDTO.getId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        organization = organizationService.updateOrganization(organization);

        return organization;

    }


    // TODO: Has Permission OP_DELETE_ORGANIZATION
    //@PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_DELETE_ORGANIZATION')")
    @DeleteMapping("/organizations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrganization(@PathVariable UUID id) throws Exception {
        organizationService.deleteOrganization(id);
    }




}

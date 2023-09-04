package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.OrganizationService;
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

import java.time.Instant;
import java.util.UUID;


@RestController
public class OrganizationController {

    Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    private OrganizationService organizationService;
    private JwtEncoder jwtEncoder;

    @Autowired
    public OrganizationController(OrganizationService organizationService,
                                  JwtEncoder jwtEncoder){
        this.organizationService = organizationService;
        this.jwtEncoder = jwtEncoder;
    }


    @PreAuthorize("@securityUtils.hasAuthorityToRequestedOrgId('OP_READ_DOCUMENT')")
    @GetMapping("/organizations")
    public Page<Organization> getAllOrganizations(@Valid OrganizationCriteria critetia, Pageable pageable) throws Exception{

        //run code to get the organization from database
        return organizationService.getAllOrganizations(critetia, pageable);
    }

    @GetMapping("/organizations/{id}")
    public Organization getOrganizationById(@PathVariable UUID id, Authentication authentication) throws Exception{

        //run code to get the organization from the database
        Organization organization = organizationService.getById(id);
        return organization;
    }

    @PostMapping(value="/organizations", consumes = {"application/json"})
    @ResponseStatus(value = HttpStatus.CREATED)
    public Organization createOrganization(@RequestBody OrganizationDTO organizationDTO) throws Exception{
        Organization organization = new Organization();
        Instant now= Instant.now();
        organization.setName(organizationDTO.getName());
        organization.setDisplayName(organizationDTO.getDisplayName());
        organization.setAddress(organizationDTO.getAddress());
        organization.setPhone(organizationDTO.getPhone());
        organization.setCreatedAt(now);
        organization.setUpdatedAt(now);
        organization = organizationService.createOrganization(organization);
        return organization;
    }

    // TODO: Has Permission OP_UPDATE_ORGANIZATION
    @PutMapping("/organizations/{id}")
    public Organization updateOrganization(@PathVariable UUID id, @RequestBody Organization organization) throws Exception{

        if (!id.equals(organization.getId())){
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }
        organization = organizationService.updateOrganization(organization);

        return organization;

    }


    // TODO: Has Permission OP_DELETE_ORGANIZATION
    @DeleteMapping("/organizations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrganization(@PathVariable UUID id) throws Exception{
        organizationService.deleteOrganization(id);
    }



}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.UserOrganization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class OrganizationService {



    private UserOrganizationRepository userOrganizationRepository;
    private OrganizationRepository organizationRepository;

    @Autowired
    public OrganizationService(UserOrganizationRepository userOrganizationRepository, OrganizationRepository organizationRepository) {
        this.userOrganizationRepository = userOrganizationRepository;
        this.organizationRepository = organizationRepository;
    }

    /**
     * Get all organizations with default page size of 100
     * @param criteria
     * @return
     */
    public Page<Organization> getAllOrganizations(OrganizationCriteria criteria) throws GendoxException {
        Pageable pageable = PageRequest.of(0, 100);
        return this.getAllOrganizations(criteria, pageable);
    }

    public Page<Organization> getAllOrganizations(OrganizationCriteria criteria, Pageable pageable) throws GendoxException {
//        if (pageable == null) {
//            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
//        }

        return organizationRepository.findAll(OrganizationPredicates.build(criteria), pageable);
    }

    public Organization getById(UUID id) throws Exception{
        return organizationRepository.findById(id)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "Organization not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public List<UserOrganization> getUserOrganizations(String userId) {
        return userOrganizationRepository.findByUserId(UUID.fromString(userId));
    }

    public Organization createOrganization(Organization organization) throws Exception{

        if (organization.getId() != null){
            throw new GendoxException("NEW_ORGANIZATION_ID_IS_NOT_NULL", "Organization id must be null", HttpStatus.BAD_REQUEST);
        }
        organization=organizationRepository.save(organization);
        return organization;

    }

    public Organization updateOrganization(Organization organization) throws Exception{
        UUID organizationId = organization.getId();
        Organization existingOrganization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "Organization not found with id: " + organizationId, HttpStatus.NOT_FOUND));

        // Update the properties of the existingOrganization with the values from the updated organization
        existingOrganization.setName(organization.getName());
        existingOrganization.setDisplayName(organization.getDisplayName());
        existingOrganization.setAddress(organization.getAddress());
        existingOrganization.setPhone(organization.getPhone());
        existingOrganization.setCreatedAt(organization.getCreatedAt());
        existingOrganization.setUpdatedAt(Instant.now());

        //save the update organization
        existingOrganization = organizationRepository.save(existingOrganization);

        return existingOrganization;

    }

   public void deleteOrganization(UUID id) throws Exception{
        Organization organization = organizationRepository.findById(id).orElse(null);

        if(organization != null){
            organizationRepository.deleteById(id);
        }else{
            throw new GendoxException("ORGANIZATION_NOT_FOUND", "Organization not found with id: " + id, HttpStatus.NOT_FOUND);
        }
   }



}

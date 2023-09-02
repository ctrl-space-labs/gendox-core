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

    public List<UserOrganization> getUserOrganizations(String userId) {
        return userOrganizationRepository.findByUserId(UUID.fromString(userId));
    }



}

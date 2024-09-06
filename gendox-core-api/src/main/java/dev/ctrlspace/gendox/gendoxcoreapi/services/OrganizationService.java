package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDidDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.WalletKeyDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ProjectCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.WalletKeyRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.OrganizationPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.OrganizationRolesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrganizationService {


    private UserOrganizationRepository userOrganizationRepository;
    private OrganizationRepository organizationRepository;
    private UserOrganizationService userOrganizationService;

    private OrganizationDidService organizationDidService;

    private WalletKeyService walletKeyService;

    private TypeService typeService;

    private ProjectService projectService;

    @Value("${walt-id.default-key.type}")
    private String keyTypeName;
    @Value("${walt-id.default-key.size}")
    private Integer characterLength;


    @Autowired
    public OrganizationService(UserOrganizationRepository userOrganizationRepository,
                               OrganizationRepository organizationRepository,
                               UserOrganizationService userOrganizationService,
                               OrganizationDidService organizationDidService,
                               WalletKeyService walletKeyService,
                               TypeService typeService,
                               ProjectService projectService) {
        this.userOrganizationRepository = userOrganizationRepository;
        this.organizationRepository = organizationRepository;
        this.userOrganizationService = userOrganizationService;
        this.organizationDidService = organizationDidService;
        this.walletKeyService = walletKeyService;
        this.typeService = typeService;
        this.projectService = projectService;

    }

    /**
     * Get all organizations with default page size of 100
     *
     * @param criteria
     * @return
     */
    public Page<Organization> getAllOrganizations(OrganizationCriteria criteria) throws GendoxException {
        Pageable pageable = PageRequest.of(0, 100);
        return this.getAllOrganizations(criteria, pageable);
    }

    public Page<Organization> getAllOrganizations(OrganizationCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }

        return organizationRepository.findAll(OrganizationPredicates.build(criteria), pageable);
    }

    public Organization getById(UUID id) throws GendoxException {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new GendoxException("ORGANIZATION_NOT_FOUND", "Organization not found with id: " + id, HttpStatus.NOT_FOUND));
    }

    public List<UserOrganization> getUserOrganizations(String userId) {
        return userOrganizationRepository.findByUserId(UUID.fromString(userId));
    }

    public Organization createOrganization(Organization organization, UUID ownerUserId) throws GendoxException {

        if (organization.getId() != null) {
            throw new GendoxException("NEW_ORGANIZATION_ID_IS_NOT_NULL", "Organization id must be null", HttpStatus.BAD_REQUEST);
        }

        organization = organizationRepository.save(organization);

        userOrganizationService.createUserOrganization(ownerUserId, organization.getId(), OrganizationRolesConstants.ADMIN);

        Type walletKeyType = typeService.getKeyTypeByName(keyTypeName);

        WalletKeyDTO walletKeyDTO = WalletKeyDTO.builder()
                .organizationId(organization.getId())
                .keyType(walletKeyType)
                .characterLength(characterLength)
                .build();
        WalletKey walletKey = walletKeyService.createWalletKey(walletKeyDTO);

        OrganizationDid organizationDid = organizationDidService.createOrganizationDid(OrganizationDidDTO.builder()
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .organizationId(organization.getId())
                        .keyId(walletKey.getId())
                .build(), "key");


        return organization;
    }

    public Organization updateOrganization(Organization organization) throws Exception {
        UUID organizationId = organization.getId();
        Organization existingOrganization = this.getById(organizationId);


        // Update the properties of the existingOrganization with the values from the updated organization
        existingOrganization.setName(organization.getName());
        existingOrganization.setAddress(organization.getAddress());
        existingOrganization.setPhone(organization.getPhone());
        existingOrganization.setDisplayName(organization.getDisplayName());



        //save the update organization
        existingOrganization = organizationRepository.save(existingOrganization);

        return existingOrganization;

    }

    public void deactivateOrganization(UUID organizationId) throws GendoxException {
        List<UserOrganization> userOrganizations = userOrganizationService.getUserOrganizationByOrganizationId(organizationId);

        Organization organization = getById(organizationId);

        deactivateAllOrgProjects(organizationId);

        for (UserOrganization userOrganization : userOrganizations) {
            userOrganizationRepository.delete(userOrganization);
        }

        organizationDidService.deleteOrganizationDidByOrganizationId(organizationId);
        walletKeyService.deleteWalletKeyByOrganizationId(organizationId);

        clearOrgData(organization);
        organizationRepository.save(organization);
    }

    private void deactivateAllOrgProjects(UUID organizationId) throws GendoxException {

        ProjectCriteria criteria = new ProjectCriteria();
        criteria.setOrganizationId(organizationId.toString());

        Page<Project> projects = projectService.getAllProjects(criteria);

        for (Project project : projects.getContent()) {
            projectService.deactivateProject(project.getId());
        }
    }

    private void clearOrgData(Organization organization) {
        organization.setName("DEACTIVATED");
        organization.setDisplayName(null);
        organization.setAddress(null);
        organization.setPhone(null);
        organization.setDeveloperEmail(null);
        organization.setUpdatedAt(null);
        organization.setCreatedAt(null);
    }


}

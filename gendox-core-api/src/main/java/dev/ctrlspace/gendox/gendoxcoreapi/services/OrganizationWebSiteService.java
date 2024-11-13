package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationWebSiteConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationPlan;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationWebSiteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class OrganizationWebSiteService {
    private OrganizationWebSiteRepository organizationWebSiteRepository;
    private OrganizationWebSiteConverter organizationWebSiteConverter;
    private OrganizationPlanService organizationPlanService;

    @Autowired
    public OrganizationWebSiteService(OrganizationWebSiteRepository organizationWebSiteRepository,
                                       OrganizationWebSiteConverter organizationWebSiteConverter,
                                       OrganizationPlanService organizationPlanService) {
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.organizationWebSiteConverter = organizationWebSiteConverter;
        this.organizationPlanService = organizationPlanService;
    }

    public OrganizationWebSite getById(UUID id) {
        return organizationWebSiteRepository.findById(id).orElse(null);
    }

    public List<OrganizationWebSite> getAllByOrganizationId(UUID organizationId) {
        return organizationWebSiteRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationWebSite createOrganizationWebSite(OrganizationWebSiteDTO organizationWebSiteDTO, UUID organizationId) {
        OrganizationWebSite organizationWebSite = organizationWebSiteConverter.toEntity(organizationWebSiteDTO);
        List<OrganizationWebSite> organizationWebSites = this.getAllByOrganizationId(organizationId);
        // Calculate the maximum allowed websites based on the organization's plan
        int maxWebSites = organizationPlanService.getAllOrganizationPlansByOrganizationId(organizationId).stream()
                .mapToInt(plan -> plan.getSubscriptionPlan().getOrganizationWebSites() * plan.getNumberOfSeats())
                .sum();

        // Check if adding a new website exceeds the allowed limit
        if (organizationWebSites.size() >= maxWebSites) {
            throw new IllegalStateException("Maximum number of websites reached for this organization");
        }

        return organizationWebSiteRepository.save(organizationWebSite);
    }

    public OrganizationWebSite updateOrganizationWebSite(UUID id, OrganizationWebSiteDTO organizationWebSiteDTO) {
        OrganizationWebSite existingOrganizationWebSite = organizationWebSiteRepository.findById(id).orElse(null);
        if (existingOrganizationWebSite == null) {
            return null;
        }
        existingOrganizationWebSite.setUrl(organizationWebSiteDTO.getUrl());
        existingOrganizationWebSite.setName(organizationWebSiteDTO.getName());
        return organizationWebSiteRepository.save(existingOrganizationWebSite);
    }

    public void deleteOrganizationWebSite(UUID id) {
        organizationWebSiteRepository.deleteById(id);
    }
}

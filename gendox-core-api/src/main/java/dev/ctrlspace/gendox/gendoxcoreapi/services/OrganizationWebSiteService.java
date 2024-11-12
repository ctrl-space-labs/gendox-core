package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationWebSiteConverter;
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

    @Autowired
    public OrganizationWebSiteService(OrganizationWebSiteRepository organizationWebSiteRepository,
                                       OrganizationWebSiteConverter organizationWebSiteConverter) {
        this.organizationWebSiteRepository = organizationWebSiteRepository;
        this.organizationWebSiteConverter = organizationWebSiteConverter;
    }

    public OrganizationWebSite getById(UUID id) {
        return organizationWebSiteRepository.findById(id).orElse(null);
    }

    public List<OrganizationWebSite> getAllByOrganizationId(UUID organizationId) {
        return organizationWebSiteRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationWebSite createOrganizationWebSite(OrganizationWebSiteDTO organizationWebSiteDTO) {
        OrganizationWebSite organizationWebSite = organizationWebSiteConverter.toEntity(organizationWebSiteDTO);
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

package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationWebSite;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationWebSiteDTO;
import org.springframework.stereotype.Component;

@Component
public class OrganizationWebSiteConverter implements GendoxConverter<OrganizationWebSite, OrganizationWebSiteDTO> {


    @Override
    public OrganizationWebSiteDTO toDTO(OrganizationWebSite organizationWebSite)  {
        OrganizationWebSiteDTO organizationWebSiteDTO = new OrganizationWebSiteDTO();
        organizationWebSiteDTO.setOrganizationId(organizationWebSite.getOrganizationId());
        organizationWebSiteDTO.setName(organizationWebSite.getName());
        organizationWebSiteDTO.setUrl(organizationWebSite.getUrl());
        return organizationWebSiteDTO;
    }

    @Override
    public OrganizationWebSite toEntity(OrganizationWebSiteDTO organizationWebSiteDTO)  {
        OrganizationWebSite organizationWebSite = new OrganizationWebSite();
        organizationWebSite.setOrganizationId(organizationWebSiteDTO.getOrganizationId());
        organizationWebSite.setName(organizationWebSiteDTO.getName());
        organizationWebSite.setUrl(organizationWebSiteDTO.getUrl());
        return organizationWebSite;
    }
}

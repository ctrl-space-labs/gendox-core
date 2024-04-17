package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationDid;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationDidDTO;

public class OrganizationDidConverter implements GendoxConverter<OrganizationDid, OrganizationDidDTO> {

    @Override
    public OrganizationDidDTO toDTO(OrganizationDid organizationDid) {
        OrganizationDidDTO organizationDidDTO = new OrganizationDidDTO();

        organizationDidDTO.setId(organizationDid.getId());
        organizationDidDTO.setOrganizationId(organizationDid.getOrganization().getId());
        organizationDidDTO.setKeyId(organizationDid.getKeyId());
        organizationDidDTO.setDid(organizationDid.getDid());
        organizationDidDTO.setWebDomain(organizationDid.getWebDomain());
        organizationDidDTO.setWebPath(organizationDid.getWebPath());
        organizationDidDTO.setCreatedAt(organizationDid.getCreatedAt());
        organizationDidDTO.setUpdatedAt(organizationDid.getUpdatedAt());

        return organizationDidDTO;


    }

    @Override
    public OrganizationDid toEntity(OrganizationDidDTO organizationDidDTO) {
        OrganizationDid organizationDid = new OrganizationDid();

        organizationDid.setId(organizationDidDTO.getId());
        organizationDid.setKeyId(organizationDidDTO.getKeyId());
        organizationDid.setDid(organizationDidDTO.getDid());
        organizationDid.setWebDomain(organizationDidDTO.getWebDomain());
        organizationDid.setWebPath(organizationDidDTO.getWebPath());
        organizationDid.setCreatedAt(organizationDidDTO.getCreatedAt());
        organizationDid.setUpdatedAt(organizationDidDTO.getUpdatedAt());

        return organizationDid;


    }
}

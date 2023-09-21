package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Organization;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.OrganizationDTO;
import org.springframework.stereotype.Component;



@Component
public class OrganizationConverter implements GendoxConverter<Organization, OrganizationDTO>{




    @Override
    public OrganizationDTO toDTO(Organization organization) {
        OrganizationDTO organizationDTO = new OrganizationDTO();

        organizationDTO.setId(organization.getId());
        organizationDTO.setName(organization.getName());
        organizationDTO.setDisplayName(organization.getDisplayName());
        organizationDTO.setAddress(organization.getAddress());
        organizationDTO.setPhone(organization.getPhone());
        organizationDTO.setCreatedAt(organization.getCreatedAt());
        organizationDTO.setUpdatedAt(organization.getUpdatedAt());


        return organizationDTO;
    }

    @Override
    public Organization toEntity(OrganizationDTO organizationDTO) {
        Organization organization = new Organization();

        organization.setId(organizationDTO.getId());
        organization.setName(organizationDTO.getName());
        organization.setDisplayName(organizationDTO.getDisplayName());
        organization.setAddress(organizationDTO.getAddress());
        organization.setPhone(organizationDTO.getPhone());
        organization.setCreatedAt(organizationDTO.getCreatedAt());
        organization.setUpdatedAt(organizationDTO.getUpdatedAt());

        return organization;
    }
}

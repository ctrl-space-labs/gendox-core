package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import org.springframework.stereotype.Component;

@Component
public class IntegrationConverter implements GendoxConverter<Integration, IntegrationDTO> {


    @Override
    public IntegrationDTO toDTO(Integration integration) {
        IntegrationDTO integrationDTO = new IntegrationDTO();

        integrationDTO.setId(integration.getId());
        integrationDTO.setProjectId(integration.getProjectId());
        integrationDTO.setIntegrationType(integration.getIntegrationType());
        integrationDTO.setActive(integration.getActive());
        integrationDTO.setUrl(integration.getUrl());
        integrationDTO.setDirectoryPath(integration.getDirectoryPath());
        integrationDTO.setRepoHead(integration.getRepoHead());
        integrationDTO.setUserName(integration.getUserName());
        integrationDTO.setPassword(integration.getPassword());
        integrationDTO.setUpdatedAt(integration.getUpdatedAt());
        integrationDTO.setCreatedAt(integration.getCreatedAt());
        integrationDTO.setUpdatedBy(integration.getUpdatedBy());
        integrationDTO.setCreatedBy(integration.getCreatedBy());

        return integrationDTO;
    }

    @Override
    public Integration toEntity(IntegrationDTO integrationDTO) {

        Integration integration = new Integration();

        integration.setId(integrationDTO.getId());
        integration.setProjectId(integrationDTO.getProjectId());
        integration.setIntegrationType(integrationDTO.getIntegrationType());
        integration.setActive(integrationDTO.getActive());
        integration.setUrl(integrationDTO.getUrl());
        integration.setDirectoryPath(integrationDTO.getDirectoryPath());
        integration.setRepoHead(integrationDTO.getRepoHead());
        integration.setUserName(integrationDTO.getUserName());
        integration.setPassword(integrationDTO.getPassword());
        integration.setUpdatedAt(integrationDTO.getUpdatedAt());
        integration.setCreatedAt(integrationDTO.getCreatedAt());
        integration.setUpdatedBy(integrationDTO.getUpdatedBy());
        integration.setCreatedBy(integrationDTO.getCreatedBy());


        return integration;


    }









}

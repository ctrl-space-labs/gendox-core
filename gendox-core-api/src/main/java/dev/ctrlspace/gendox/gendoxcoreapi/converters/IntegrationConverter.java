package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegrationDTO;
import org.springframework.stereotype.Component;

@Component
public class IntegrationConverter implements GendoxConverter<Integration, IntegrationDTO> {

    @Override
    public IntegrationDTO toDTO(Integration integration) {
        IntegrationDTO integrationDTO = new IntegrationDTO();

        if (integration.getId() != null) {
            integrationDTO.setId(integration.getId());
        }
        if (integration.getOrganizationId() != null) {
            integrationDTO.setOrganizationId(integration.getOrganizationId());
        }
        if (integration.getProjectId() != null) {
            integrationDTO.setProjectId(integration.getProjectId());
        }
        if (integration.getIntegrationType() != null) {
            integrationDTO.setIntegrationType(integration.getIntegrationType());
        }
        if (integration.getActive() != null) {
            integrationDTO.setActive(integration.getActive());
        }
        if (integration.getUrl() != null) {
            integrationDTO.setUrl(integration.getUrl());
        }
        if (integration.getQueueName() != null) {
            integrationDTO.setQueueName(integration.getQueueName());
        }
        if (integration.getDirectoryPath() != null) {
            integrationDTO.setDirectoryPath(integration.getDirectoryPath());
        }
        if (integration.getRepoHead() != null) {
            integrationDTO.setRepoHead(integration.getRepoHead());
        }
        if (integration.getUserName() != null) {
            integrationDTO.setUserName(integration.getUserName());
        }
        if (integration.getPassword() != null) {
            integrationDTO.setPassword(integration.getPassword());
        }
        if (integration.getUpdatedAt() != null) {
            integrationDTO.setUpdatedAt(integration.getUpdatedAt());
        }
        if (integration.getCreatedAt() != null) {
            integrationDTO.setCreatedAt(integration.getCreatedAt());
        }
        if (integration.getUpdatedBy() != null) {
            integrationDTO.setUpdatedBy(integration.getUpdatedBy());
        }
        if (integration.getCreatedBy() != null) {
            integrationDTO.setCreatedBy(integration.getCreatedBy());
        }

        return integrationDTO;
    }

    @Override
    public Integration toEntity(IntegrationDTO integrationDTO) {
        Integration integration = new Integration();

        if (integrationDTO.getId() != null) {
            integration.setId(integrationDTO.getId());
        }
        if (integrationDTO.getOrganizationId() != null) {
            integration.setOrganizationId(integrationDTO.getOrganizationId());
        }
        if (integrationDTO.getProjectId() != null) {
            integration.setProjectId(integrationDTO.getProjectId());
        }
        if (integrationDTO.getIntegrationType() != null) {
            integration.setIntegrationType(integrationDTO.getIntegrationType());
        }
        if (integrationDTO.getActive() != null) {
            integration.setActive(integrationDTO.getActive());
        }
        if (integrationDTO.getUrl() != null) {
            integration.setUrl(integrationDTO.getUrl());
        }
        if (integrationDTO.getQueueName() != null) {
            integration.setQueueName(integrationDTO.getQueueName());
        }
        if (integrationDTO.getDirectoryPath() != null) {
            integration.setDirectoryPath(integrationDTO.getDirectoryPath());
        }
        if (integrationDTO.getRepoHead() != null) {
            integration.setRepoHead(integrationDTO.getRepoHead());
        }
        if (integrationDTO.getUserName() != null) {
            integration.setUserName(integrationDTO.getUserName());
        }
        if (integrationDTO.getPassword() != null) {
            integration.setPassword(integrationDTO.getPassword());
        }
        if (integrationDTO.getUpdatedAt() != null) {
            integration.setUpdatedAt(integrationDTO.getUpdatedAt());
        }
        if (integrationDTO.getCreatedAt() != null) {
            integration.setCreatedAt(integrationDTO.getCreatedAt());
        }
        if (integrationDTO.getUpdatedBy() != null) {
            integration.setUpdatedBy(integrationDTO.getUpdatedBy());
        }
        if (integrationDTO.getCreatedBy() != null) {
            integration.setCreatedBy(integrationDTO.getCreatedBy());
        }

        return integration;
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.OrganizationConnectorConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationConnectorDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.OrganizationConnectorRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ConnectorTypesConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class OrganizationConnectorService {

    private final OrganizationConnectorRepository organizationConnectorRepository;
    private final OrganizationConnectorConverter organizationConnectorConverter;
    private final TypeService typeService;

    @Autowired
    public OrganizationConnectorService(OrganizationConnectorRepository organizationConnectorRepository,
                                        OrganizationConnectorConverter organizationConnectorConverter,
                                        TypeService typeService) {
        this.organizationConnectorRepository = organizationConnectorRepository;
        this.organizationConnectorConverter = organizationConnectorConverter;
        this.typeService = typeService;
    }

    public List<OrganizationConnector> getAllByOrganizationId(UUID organizationId) {
        return organizationConnectorRepository.findAllByOrganizationId(organizationId);
    }

    public OrganizationConnector getByOrganizationAndType(UUID organizationId, String connectorTypeName) throws GendoxException {
        return organizationConnectorRepository
                .findByOrganizationIdAndConnectorType_Name(organizationId, connectorTypeName)
                .orElseThrow(() -> new GendoxException(
                        "ORGANIZATION_CONNECTOR_NOT_FOUND",
                        "Connector of type '" + connectorTypeName + "' not found for organization " + organizationId,
                        HttpStatus.NOT_FOUND));
    }

    /**
     * Upserts a connector for the given organization and type. If a row already exists
     * for the (organizationId, connectorType) pair, its config and is_active are updated;
     * otherwise a new row is inserted. The connector_type name is resolved against
     * gendox_core.types under the CONNECTOR_TYPE category.
     */
    public OrganizationConnector upsert(UUID organizationId, String connectorTypeName, OrganizationConnectorDTO dto) throws GendoxException {
        Type type = typeService.getByCategoryAndName(ConnectorTypesConstants.CATEGORY, connectorTypeName);

        Optional<OrganizationConnector> existingOpt = organizationConnectorRepository
                .findByOrganizationIdAndConnectorType_Name(organizationId, connectorTypeName);

        OrganizationConnector incoming = organizationConnectorConverter.toEntity(dto);

        OrganizationConnector toSave;
        if (existingOpt.isPresent()) {
            toSave = existingOpt.get();
            toSave.setConfig(incoming.getConfig());
            toSave.setActive(incoming.getActive() == null ? Boolean.TRUE : incoming.getActive());
        } else {
            toSave = incoming;
            toSave.setId(null);
            toSave.setOrganizationId(organizationId);
            toSave.setConnectorType(type);
            if (toSave.getActive() == null) {
                toSave.setActive(Boolean.TRUE);
            }
        }

        return organizationConnectorRepository.save(toSave);
    }

    public void delete(UUID organizationId, String connectorTypeName) throws GendoxException {
        OrganizationConnector existing = getByOrganizationAndType(organizationId, connectorTypeName);
        organizationConnectorRepository.delete(existing);
    }
}

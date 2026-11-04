package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationConnector;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.OrganizationConnectorDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

@Component
public class OrganizationConnectorConverter
        implements GendoxConverter<OrganizationConnector, OrganizationConnectorDTO> {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    @Autowired
    public OrganizationConnectorConverter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public OrganizationConnectorDTO toDTO(OrganizationConnector entity) throws GendoxException {
        OrganizationConnectorDTO dto = new OrganizationConnectorDTO();
        dto.setId(entity.getId());
        dto.setOrganizationId(entity.getOrganizationId());
        Type type = entity.getConnectorType();
        dto.setConnectorType(type == null ? null : type.getName());
        dto.setIsActive(entity.getActive());
        dto.setConfig(deserializeConfig(entity.getConfig()));
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    /**
     * Maps DTO scalar fields onto an entity. Does NOT resolve the connectorType
     * Type entity — the service is responsible for looking that up from
     * gendox_core.types and setting it before save.
     */
    @Override
    public OrganizationConnector toEntity(OrganizationConnectorDTO dto) throws GendoxException {
        OrganizationConnector entity = new OrganizationConnector();
        entity.setId(dto.getId());
        entity.setOrganizationId(dto.getOrganizationId());
        entity.setActive(dto.getIsActive() == null ? Boolean.TRUE : dto.getIsActive());
        entity.setConfig(serializeConfig(dto.getConfig()));
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(dto.getUpdatedAt());
        return entity;
    }

    private Map<String, Object> deserializeConfig(String json) throws GendoxException {
        if (json == null || json.isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            throw new GendoxException("CONNECTOR_CONFIG_DESERIALIZE_ERROR",
                    "Could not deserialize connector config JSON", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String serializeConfig(Map<String, Object> config) throws GendoxException {
        Map<String, Object> safe = config == null ? Collections.emptyMap() : config;
        try {
            return objectMapper.writeValueAsString(safe);
        } catch (JsonProcessingException e) {
            throw new GendoxException("CONNECTOR_CONFIG_SERIALIZE_ERROR",
                    "Could not serialize connector config JSON", HttpStatus.BAD_REQUEST);
        }
    }
}

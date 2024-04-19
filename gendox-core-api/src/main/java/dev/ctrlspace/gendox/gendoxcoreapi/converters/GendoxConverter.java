package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;

public interface GendoxConverter<Entity, DTO> {

    DTO toDTO(Entity entity) throws GendoxException, JsonProcessingException;

    Entity toEntity(DTO dto) throws GendoxException;
}

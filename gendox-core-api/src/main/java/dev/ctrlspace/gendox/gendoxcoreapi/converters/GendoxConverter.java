package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import tools.jackson.core.JacksonException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;

public interface GendoxConverter<Entity, DTO> {

    DTO toDTO(Entity entity) throws GendoxException, JacksonException;

    Entity toEntity(DTO dto) throws GendoxException;
}

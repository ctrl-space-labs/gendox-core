package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;

public interface GendoxConverter<Entity, DTO> {

    DTO toDTO(Entity entity) throws GendoxException;

    Entity toEntity(DTO dto);
}

package dev.ctrlspace.gendox.gendoxcoreapi.converters;

public interface GendoxConverter<Entity, DTO> {

    DTO toDTO(Entity entity);

    Entity toEntity(DTO dto);
}

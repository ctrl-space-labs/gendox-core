package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.EOTaskGeometry;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.EOTaskGeometryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EOTaskGeometryConverter implements GendoxConverter<EOTaskGeometry, EOTaskGeometryDTO> {

    private final TypeRepository typeRepository;

    @Autowired
    public EOTaskGeometryConverter(TypeRepository typeRepository) {
        this.typeRepository = typeRepository;
    }

    @Override
    public EOTaskGeometryDTO toDTO(EOTaskGeometry entity) {
        EOTaskGeometryDTO dto = new EOTaskGeometryDTO();

        dto.setId(entity.getId());
        dto.setTaskId(entity.getTaskId());
        dto.setGeometryTypeName(entity.getGeometryType() != null ? entity.getGeometryType().getName() : null);
        dto.setCoordinates(entity.getCoordinates());
        dto.setDisplayOrder(entity.getDisplayOrder());
        dto.setTitle(entity.getTitle());

        return dto;
    }

    @Override
    public EOTaskGeometry toEntity(EOTaskGeometryDTO dto) {
        EOTaskGeometry entity = new EOTaskGeometry();

        if (dto.getId() != null) {
            entity.setId(dto.getId());
        }
        if (dto.getTaskId() != null) {
            entity.setTaskId(dto.getTaskId());
        }
        if (dto.getGeometryTypeName() != null) {
            Type geometryType = typeRepository
                    .findByTypeCategoryAndName("GEOMETRY_TYPE", dto.getGeometryTypeName())
                    .orElseThrow(() -> new IllegalArgumentException("Unknown geometry type: " + dto.getGeometryTypeName()));
            entity.setGeometryType(geometryType);
        }
        if (dto.getCoordinates() != null) {
            entity.setCoordinates(dto.getCoordinates());
        }
        if (dto.getDisplayOrder() != null) {
            entity.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getTitle() != null) {
            entity.setTitle(dto.getTitle());
        }

        return entity;
    }
}

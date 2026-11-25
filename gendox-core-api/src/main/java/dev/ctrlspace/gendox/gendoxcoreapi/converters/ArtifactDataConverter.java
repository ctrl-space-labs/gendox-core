package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactData;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDataDTO;
import org.springframework.stereotype.Component;

/**
 * An artifact's data document as the artifact reads it (gendox-core#600). Whose private document it is stays out: the
 * reader only ever gets their own.
 */
@Component
public class ArtifactDataConverter {

    public ArtifactDataDTO toDTO(ArtifactData document) {
        ArtifactDataDTO dto = new ArtifactDataDTO();
        dto.setCollection(document.getCollection());
        dto.setDocId(document.getDocId());
        dto.setData(document.getData());
        dto.setPrivateDocument(document.getPrivateTo() != null);
        dto.setRevision(document.getRevision());
        dto.setUpdatedBy(document.getUpdatedBy());
        dto.setUpdatedAt(document.getUpdatedAt());
        return dto;
    }
}

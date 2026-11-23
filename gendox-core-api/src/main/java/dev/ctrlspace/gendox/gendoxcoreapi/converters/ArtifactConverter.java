package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactVersionSummaryDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ArtifactConverter implements GendoxConverter<Artifact, ArtifactSummaryDTO> {

    @Override
    public ArtifactSummaryDTO toDTO(Artifact artifact) {
        ArtifactSummaryDTO artifactSummaryDTO = new ArtifactSummaryDTO();
        artifactSummaryDTO.setId(artifact.getId());
        artifactSummaryDTO.setThreadId(artifact.getThreadId());
        artifactSummaryDTO.setTitle(artifact.getTitle());
        artifactSummaryDTO.setArtifactType(artifact.getArtifactType());
        artifactSummaryDTO.setCodeLanguage(artifact.getCodeLanguage());
        artifactSummaryDTO.setLatestVersion(artifact.getLatestVersion());
        artifactSummaryDTO.setCreatedAt(artifact.getCreatedAt());
        artifactSummaryDTO.setUpdatedAt(artifact.getUpdatedAt());
        artifactSummaryDTO.setCreatedBy(artifact.getCreatedBy());
        artifactSummaryDTO.setUpdatedBy(artifact.getUpdatedBy());
        artifactSummaryDTO.setOwnerId(artifact.getOwnerId());

        return artifactSummaryDTO;
    }

    /**
     * An artifact with its versions and the content of the one shown.
     */
    public ArtifactDTO toDTO(Artifact artifact, List<ArtifactVersionSummaryDTO> versions, ArtifactVersion shown) {
        ArtifactDTO artifactDTO = new ArtifactDTO();
        artifactDTO.setId(artifact.getId());
        artifactDTO.setThreadId(artifact.getThreadId());
        artifactDTO.setTitle(artifact.getTitle());
        artifactDTO.setArtifactType(artifact.getArtifactType());
        artifactDTO.setCodeLanguage(artifact.getCodeLanguage());
        artifactDTO.setLatestVersion(artifact.getLatestVersion());
        artifactDTO.setCreatedAt(artifact.getCreatedAt());
        artifactDTO.setUpdatedAt(artifact.getUpdatedAt());
        artifactDTO.setCreatedBy(artifact.getCreatedBy());
        artifactDTO.setUpdatedBy(artifact.getUpdatedBy());
        artifactDTO.setOwnerId(artifact.getOwnerId());
        artifactDTO.setVersions(versions);
        artifactDTO.setVersion(shown.getVersion());
        artifactDTO.setContent(shown.getContent());

        return artifactDTO;
    }

    @Override
    public Artifact toEntity(ArtifactSummaryDTO artifactSummaryDTO) {
        Artifact artifact = new Artifact();
        artifact.setId(artifactSummaryDTO.getId());
        artifact.setThreadId(artifactSummaryDTO.getThreadId());
        artifact.setTitle(artifactSummaryDTO.getTitle());
        artifact.setArtifactType(artifactSummaryDTO.getArtifactType());
        artifact.setCodeLanguage(artifactSummaryDTO.getCodeLanguage());
        artifact.setLatestVersion(artifactSummaryDTO.getLatestVersion());

        return artifact;
    }
}
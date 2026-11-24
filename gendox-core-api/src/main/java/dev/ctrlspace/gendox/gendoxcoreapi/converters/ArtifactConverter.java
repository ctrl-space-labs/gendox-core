package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactVersionSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService;
import org.springframework.lang.Nullable;
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
        artifactSummaryDTO.setDisplay(artifact.getDisplay());
        artifactSummaryDTO.setLatestVersion(artifact.getLatestVersion());
        artifactSummaryDTO.setCreatedAt(artifact.getCreatedAt());
        artifactSummaryDTO.setUpdatedAt(artifact.getUpdatedAt());
        artifactSummaryDTO.setCreatedBy(artifact.getCreatedBy());
        artifactSummaryDTO.setUpdatedBy(artifact.getUpdatedBy());
        artifactSummaryDTO.setOwnerId(artifact.getOwnerId());

        return artifactSummaryDTO;
    }

    /**
     * An artifact with its versions, the content of the one shown, and the reader's role on it (null for none).
     */
    public ArtifactDTO toDTO(Artifact artifact, List<ArtifactVersionSummaryDTO> versions, ArtifactVersion shown,
                             @Nullable ArtifactAccessService.Role yourRole) {
        ArtifactDTO artifactDTO = new ArtifactDTO();
        artifactDTO.setId(artifact.getId());
        artifactDTO.setThreadId(artifact.getThreadId());
        artifactDTO.setTitle(artifact.getTitle());
        artifactDTO.setArtifactType(artifact.getArtifactType());
        artifactDTO.setCodeLanguage(artifact.getCodeLanguage());
        artifactDTO.setDisplay(artifact.getDisplay());
        artifactDTO.setLatestVersion(artifact.getLatestVersion());
        artifactDTO.setCreatedAt(artifact.getCreatedAt());
        artifactDTO.setUpdatedAt(artifact.getUpdatedAt());
        artifactDTO.setCreatedBy(artifact.getCreatedBy());
        artifactDTO.setUpdatedBy(artifact.getUpdatedBy());
        artifactDTO.setOwnerId(artifact.getOwnerId());
        artifactDTO.setVersions(versions);
        artifactDTO.setVersion(shown.getVersion());
        artifactDTO.setContent(shown.getContent());
        artifactDTO.setYourRole(yourRole == null ? null : yourRole.name());

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
        artifact.setDisplay(artifactSummaryDTO.getDisplay());
        artifact.setLatestVersion(artifactSummaryDTO.getLatestVersion());

        return artifact;
    }
}
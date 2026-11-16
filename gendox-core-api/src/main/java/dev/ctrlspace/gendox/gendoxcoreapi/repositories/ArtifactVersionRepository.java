package dev.ctrlspace.gendox.gendoxcoreapi.repositories;

import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactVersionSummaryDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArtifactVersionRepository extends JpaRepository<ArtifactVersion, UUID> {

    Optional<ArtifactVersion> findByArtifactIdAndVersion(UUID artifactId, Integer version);

    /**
     * The versions of an artifact, oldest first, without their content.
     */
    @Query("select new dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactVersionSummaryDTO(v.version, v.messageId, v.createdAt) " +
            "from ArtifactVersion v where v.artifactId = :artifactId order by v.version asc")
    List<ArtifactVersionSummaryDTO> findSummariesByArtifactId(@Param("artifactId") UUID artifactId);
}
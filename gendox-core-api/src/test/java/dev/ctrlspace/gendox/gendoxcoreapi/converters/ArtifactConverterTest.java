package dev.ctrlspace.gendox.gendoxcoreapi.converters;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ArtifactConverterTest {

    private final ArtifactConverter converter = new ArtifactConverter();

    private static Artifact artifact() {
        return Artifact.builder().id(UUID.randomUUID()).threadId(UUID.randomUUID()).title("EUR to USD")
                .artifactType(Type.builder().name("HTML").build())
                .latestVersion(2).ownerId(UUID.randomUUID()).build();
    }

    @Test
    void aSummaryCarriesItsKind() {
        ArtifactSummaryDTO summary = converter.toDTO(artifact());

        assertEquals("HTML", summary.getArtifactType().getName());
        assertEquals("EUR to USD", summary.getTitle());
    }

    @Test
    void anArtifactCarriesItsContentAndTheReadersRole() {
        Artifact artifact = artifact();
        ArtifactVersion shown = ArtifactVersion.builder().version(2).content("<p>x</p>").build();

        ArtifactDTO dto = converter.toDTO(artifact, List.of(), shown, Role.EDIT);

        assertEquals("EDIT", dto.getYourRole());
        assertEquals("<p>x</p>", dto.getContent());
    }

    @Test
    void aSummaryTurnedBackKeepsItsKindAndVersion() {
        Artifact artifact = artifact();

        Artifact back = converter.toEntity(converter.toDTO(artifact));

        assertEquals("HTML", back.getArtifactType().getName());
        assertEquals(2, back.getLatestVersion());
    }

    @Test
    void aPublicReaderGetsTheArtifactAndTheAgentNothingMore() {
        Artifact artifact = artifact().toBuilder().publicId(UUID.randomUUID()).build();
        ArtifactVersion shown = ArtifactVersion.builder().version(2).content("<p>x</p>").createdBy(UUID.randomUUID()).build();

        var dto = converter.toPublicDTO(artifact, shown, "Sales assistant");

        assertEquals(artifact.getPublicId(), dto.getPublicId());
        assertEquals("EUR to USD", dto.getTitle());
        assertEquals("HTML", dto.getArtifactType().getName());
        assertEquals(2, dto.getVersion());
        assertEquals("<p>x</p>", dto.getContent());
        assertEquals("Sales assistant", dto.getAgentName());
    }
}

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
                .artifactType(Type.builder().name("HTML").build()).display(Type.builder().name("INLINE").build())
                .latestVersion(2).ownerId(UUID.randomUUID()).build();
    }

    @Test
    void aSummaryCarriesHowItShows() {
        ArtifactSummaryDTO summary = converter.toDTO(artifact());

        assertEquals("INLINE", summary.getDisplay().getName());
        assertEquals("HTML", summary.getArtifactType().getName());
    }

    @Test
    void anArtifactCarriesHowItShowsAndTheReadersRole() {
        Artifact artifact = artifact();
        ArtifactVersion shown = ArtifactVersion.builder().version(2).content("<p>x</p>").build();

        ArtifactDTO dto = converter.toDTO(artifact, List.of(), shown, Role.EDIT);

        assertEquals("INLINE", dto.getDisplay().getName());
        assertEquals("EDIT", dto.getYourRole());
        assertEquals("<p>x</p>", dto.getContent());
    }

    @Test
    void anArtifactWithoutADisplayIsShownAsACardByTheReader() {
        Artifact artifact = artifact().toBuilder().display(null).build();

        assertNull(converter.toDTO(artifact).getDisplay());
    }

    @Test
    void aSummaryTurnedBackKeepsItsDisplay() {
        Artifact artifact = artifact();

        Artifact back = converter.toEntity(converter.toDTO(artifact));

        assertEquals("INLINE", back.getDisplay().getName());
    }
}

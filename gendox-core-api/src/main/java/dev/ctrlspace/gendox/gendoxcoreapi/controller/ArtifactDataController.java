package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactDataConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactDataRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactDataService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * The data of an artifact (gendox-core#600): what people do inside it, as documents in collections. The artifact never
 * calls these itself: its frame is sealed, and the host calls them with the signed-in user's token. Signed-in people
 * only; the artifact's access decides on every call: a Viewer reads, a Contributor and up also writes the shared
 * documents, and anyone who can see it keeps private documents of their own.
 */
@RestController
public class ArtifactDataController {

    private final ArtifactDataService artifactDataService;
    private final ArtifactDataConverter artifactDataConverter;
    private final SecurityUtils securityUtils;

    public ArtifactDataController(ArtifactDataService artifactDataService,
                                  ArtifactDataConverter artifactDataConverter,
                                  SecurityUtils securityUtils) {
        this.artifactDataService = artifactDataService;
        this.artifactDataConverter = artifactDataConverter;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @GetMapping("artifacts/{artifactId}/data/{collection}")
    @Operation(summary = "List a collection of an artifact's data",
            description = "Its shared documents and the signed-in user's own private ones, the last changed last. For " +
                    "anyone who can see the artifact.")
    public List<ArtifactDataDTO> list(@PathVariable UUID artifactId, @PathVariable String collection)
            throws GendoxException {
        return artifactDataService.list(artifactId, securityUtils.getUserId(), collection).stream()
                .map(artifactDataConverter::toDTO)
                .toList();
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @GetMapping("artifacts/{artifactId}/data/{collection}/{docId}")
    @Operation(summary = "Get a document of an artifact's data",
            description = "The shared one, or with private=true the signed-in user's own. For anyone who can see the " +
                    "artifact.")
    public ArtifactDataDTO get(@PathVariable UUID artifactId, @PathVariable String collection,
                               @PathVariable String docId,
                               @RequestParam(name = "private", defaultValue = "false") boolean isPrivate)
            throws GendoxException {
        return artifactDataConverter.toDTO(
                artifactDataService.get(artifactId, securityUtils.getUserId(), collection, docId, isPrivate));
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PutMapping("artifacts/{artifactId}/data/{collection}/{docId}")
    @Operation(summary = "Write a document of an artifact's data",
            description = "The whole document, made when it is not there. A shared one needs the INTERACT role; a " +
                    "private one, only to see the artifact. A revision that is not the latest is refused with 409.")
    public ArtifactDataDTO set(@PathVariable UUID artifactId, @PathVariable String collection,
                               @PathVariable String docId, @RequestBody ArtifactDataRequestDTO request)
            throws GendoxException {
        return artifactDataConverter.toDTO(artifactDataService.set(artifactId, securityUtils.getUserId(), collection,
                docId, request.getData(), request.wantsPrivate(), request.getRevision()));
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PatchMapping("artifacts/{artifactId}/data/{collection}/{docId}")
    @Operation(summary = "Update fields of a document of an artifact's data",
            description = "Only the fields given change; the document is made when it is not there. The same roles " +
                    "and revision rule as writing it.")
    public ArtifactDataDTO update(@PathVariable UUID artifactId, @PathVariable String collection,
                                  @PathVariable String docId, @RequestBody ArtifactDataRequestDTO request)
            throws GendoxException {
        return artifactDataConverter.toDTO(artifactDataService.update(artifactId, securityUtils.getUserId(), collection,
                docId, request.getData(), request.wantsPrivate(), request.getRevision()));
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @DeleteMapping("artifacts/{artifactId}/data/{collection}/{docId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a document of an artifact's data",
            description = "The shared one, or with private=true the signed-in user's own; one that is not there is " +
                    "not an error. The same roles as writing it.")
    public void delete(@PathVariable UUID artifactId, @PathVariable String collection, @PathVariable String docId,
                       @RequestParam(name = "private", defaultValue = "false") boolean isPrivate)
            throws GendoxException {
        artifactDataService.delete(artifactId, securityUtils.getUserId(), collection, docId, isPrivate);
    }
}

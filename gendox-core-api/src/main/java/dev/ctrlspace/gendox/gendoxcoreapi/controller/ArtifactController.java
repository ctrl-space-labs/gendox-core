package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactSummaryDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * The artifacts of a chat thread, read only: the agent writes them through its tools. Whoever may
 * read the thread's messages may read its artifacts, public threads included.
 */
@RestController
public class ArtifactController {

    private final ArtifactService artifactService;
    private final ArtifactConverter artifactConverter;
    private final SecurityUtils securityUtils;

    public ArtifactController(ArtifactService artifactService,
                              ArtifactConverter artifactConverter,
                              SecurityUtils securityUtils) {
        this.artifactService = artifactService;
        this.artifactConverter = artifactConverter;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/projects/{projectId}/artifacts")
    @Operation(summary = "Get the user's artifacts with an agent",
            description = "Retrieve the artifacts of the conversations the signed-in user is a member of, in this project, " +
                    "without their content, last changed first. Filter with search (title) and artifactType (HTML, SVG, " +
                    "MARKDOWN, CODE). Pagination is supported, up to 100 per page.")
    public Page<ArtifactSummaryDTO> getAllByProject(@PathVariable UUID organizationId,
                                                    @PathVariable UUID projectId,
                                                    ArtifactCriteria criteria,
                                                    Pageable pageable) throws GendoxException {
        if (pageable == null || pageable.isUnpaged()) {
            pageable = PageRequest.of(0, 20);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "updatedAt"));
        }
        // the project and the user come from the path and the sign-in, never from the request
        criteria.setProjectId(projectId);
        criteria.setMemberId(securityUtils.getUserId());

        Page<Artifact> artifacts = artifactService.getAll(criteria, pageable);
        Map<UUID, String> threadNames = artifactService.threadNamesOf(artifacts.getContent());
        return artifacts.map(artifact -> artifactConverter.toDTO(artifact).toBuilder()
                .threadName(threadNames.get(artifact.getThreadId()))
                .build());
    }

    @PreAuthorize("(@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') && @securityUtils.hasThreadMemberAccess(#threadId)) " +
            "|| @securityUtils.isPublicThread(#threadId)")
    @GetMapping("threads/{threadId}/artifacts")
    @Operation(summary = "Get the artifacts of a Thread",
            description = "Retrieve the artifacts the agent wrote in a thread, oldest first, without their content. " +
                    "The user should have the rights to access this chat.")
    public List<ArtifactSummaryDTO> getAllByThread(@PathVariable UUID threadId) {
        return artifactService.getAllByThread(threadId).stream()
                .map(artifactConverter::toDTO)
                .toList();
    }

    @PreAuthorize("(@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') && @securityUtils.hasThreadMemberAccess(#threadId)) " +
            "|| @securityUtils.isPublicThread(#threadId)")
    @GetMapping("threads/{threadId}/artifacts/{artifactId}")
    @Operation(summary = "Get an artifact of a Thread",
            description = "Retrieve an artifact with the list of its versions and the content of the latest one. " +
                    "The user should have the rights to access this chat.")
    public ArtifactDTO getById(@PathVariable UUID threadId, @PathVariable UUID artifactId) throws GendoxException {
        return toDTO(threadId, artifactId, null);
    }

    @PreAuthorize("(@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') && @securityUtils.hasThreadMemberAccess(#threadId)) " +
            "|| @securityUtils.isPublicThread(#threadId)")
    @GetMapping("threads/{threadId}/artifacts/{artifactId}/versions/{version}")
    @Operation(summary = "Get a version of an artifact",
            description = "Retrieve an artifact with the list of its versions and the content of the given one. " +
                    "The user should have the rights to access this chat.")
    public ArtifactDTO getVersion(@PathVariable UUID threadId, @PathVariable UUID artifactId,
                                  @PathVariable Integer version) throws GendoxException {
        return toDTO(threadId, artifactId, version);
    }

    private ArtifactDTO toDTO(UUID threadId, UUID artifactId, Integer version) throws GendoxException {
        Artifact artifact = artifactService.getByIdInThread(threadId, artifactId);
        ArtifactVersion shown = artifactService.getVersion(artifact, version);
        return artifactConverter.toDTO(artifact, artifactService.getVersionSummaries(artifactId), shown);
    }
}
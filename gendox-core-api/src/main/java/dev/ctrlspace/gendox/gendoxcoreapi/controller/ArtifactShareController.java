package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactShareConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareCreateRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareOwnerViewDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareReaderViewDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactShareCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactShareService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Shares of artifacts. Sharing and stopping a share is for a signed-in member of the artifact's thread — never an
 * API key or an agent, since a share speaks for a person. Opening a share and the "Shared with you" list are for
 * signed-in users; whether this reader may open a share is decided by {@link ArtifactShareService} on every opening.
 */
@RestController
public class ArtifactShareController {

    private final ArtifactShareService artifactShareService;
    private final ArtifactService artifactService;
    private final ArtifactShareConverter artifactShareConverter;
    private final SecurityUtils securityUtils;

    public ArtifactShareController(ArtifactShareService artifactShareService,
                                   ArtifactService artifactService,
                                   ArtifactShareConverter artifactShareConverter,
                                   SecurityUtils securityUtils) {
        this.artifactShareService = artifactShareService;
        this.artifactService = artifactService;
        this.artifactShareConverter = artifactShareConverter;
        this.securityUtils = securityUtils;
    }

    // ---------------------------------------------------------------- the owner's side

    @PreAuthorize("@securityUtils.isSignedInPerson() " +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "&& @securityUtils.hasThreadMemberAccess(#threadId)")
    @GetMapping("threads/{threadId}/artifacts/{artifactId}/shares")
    @Operation(summary = "Get an artifact's shares",
            description = "The artifact's active shares, oldest first: with the whole project, or with one user. " +
                    "For a signed-in member of the thread.")
    public List<ArtifactShareOwnerViewDTO> getShares(@PathVariable UUID threadId,
                                                     @PathVariable UUID artifactId) throws GendoxException {
        artifactService.getByIdInThread(threadId, artifactId);
        List<ArtifactShare> shares = artifactShareService.getActiveShares(artifactId);
        Map<UUID, User> users = artifactShareService.usersById(
                shares.stream().map(ArtifactShare::getSharedWithUserId).toList());
        return shares.stream().map(share -> artifactShareConverter.toOwnerView(share, users)).toList();
    }

    @PreAuthorize("@securityUtils.isSignedInPerson() " +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "&& @securityUtils.hasThreadMemberAccess(#threadId)")
    @PostMapping("threads/{threadId}/artifacts/{artifactId}/shares")
    @Operation(summary = "Share an artifact",
            description = "Shares the artifact, read only and without its conversation, with every member of its " +
                    "project (audience PROJECT) or with one member of its organization (audience USER, " +
                    "sharedWithUserId). Replaces the active share with the same audience. version: null follows " +
                    "the latest. expiresAt: null for no end. For a signed-in member of the thread.")
    public ArtifactShareOwnerViewDTO share(@PathVariable UUID threadId,
                                           @PathVariable UUID artifactId,
                                           @RequestBody ArtifactShareCreateRequestDTO request) throws GendoxException {
        ArtifactShare share = artifactShareService.share(threadId, artifactId, securityUtils.getUserId(), request);
        Map<UUID, User> users = artifactShareService.usersById(
                Stream.of(share.getSharedWithUserId()).filter(java.util.Objects::nonNull).toList());
        return artifactShareConverter.toOwnerView(share, users);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson() " +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedThreadIdFromPathVariable') " +
            "&& @securityUtils.hasThreadMemberAccess(#threadId)")
    @DeleteMapping("threads/{threadId}/artifacts/{artifactId}/shares/{shareId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Stop sharing an artifact",
            description = "Stops one share of the artifact. Stopping one already stopped changes nothing. " +
                    "For a signed-in member of the thread.")
    public void revoke(@PathVariable UUID threadId,
                       @PathVariable UUID artifactId,
                       @PathVariable UUID shareId) throws GendoxException {
        artifactShareService.revoke(threadId, artifactId, shareId, securityUtils.getUserId());
    }

    // ---------------------------------------------------------------- the reader's side

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @GetMapping("artifact-shares/{shareId}")
    @Operation(summary = "Open a shared artifact",
            description = "The shared artifact with its content, without its conversation. Not found unless the " +
                    "share is active and was made with the signed-in user, or with a project they are a member of.")
    public ArtifactShareReaderViewDTO open(@PathVariable UUID shareId) throws GendoxException {
        ArtifactShare share = artifactShareService.open(shareId, securityUtils.getUserId());
        return artifactShareConverter.toReaderView(share,
                artifactShareService.organizationIdOf(share),
                artifactShareService.usersById(List.of(share.getCreatedBy())),
                artifactShareService.versionOf(share));
    }

    @PreAuthorize("@securityUtils.isSignedInPerson() " +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("organizations/{organizationId}/artifact-shares")
    @Operation(summary = "Get the artifacts shared with you",
            description = "The active shares made with the signed-in user, or with a project of this organization " +
                    "they are a member of, without content, newest first. projectId narrows the list to one agent; " +
                    "filter with search (title) and artifactType (HTML, SVG, MARKDOWN, CODE). Up to 100 per page.")
    public Page<ArtifactShareReaderViewDTO> getSharedWithMe(@PathVariable UUID organizationId,
                                                            @RequestParam(required = false) UUID projectId,
                                                            ArtifactShareCriteria criteria,
                                                            Pageable pageable,
                                                            Authentication authentication) throws GendoxException {
        if (pageable == null || pageable.isUnpaged()) {
            pageable = PageRequest.of(0, 20);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }
        if (pageable.getSort().isUnsorted()) {
            pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        // who reads, where, and through which projects come from the path and the sign-in, never from the request
        UserProfile reader = (UserProfile) authentication.getPrincipal();
        criteria.setReaderId(UUID.fromString(reader.getId()));
        criteria.setOrganizationId(organizationId);
        criteria.setReaderProjectIds(projectIdsIn(reader, organizationId));
        criteria.setProjectId(projectId);

        Page<ArtifactShare> shares = artifactShareService.getSharedWith(criteria, pageable);
        Map<UUID, User> users = artifactShareService.usersById(
                shares.getContent().stream().map(ArtifactShare::getCreatedBy).toList());
        return shares.map(share -> artifactShareConverter.toReaderView(share, organizationId, users, null));
    }

    /** The projects of the organization the signed-in user is a member of, as their sign-in lists them. */
    private static List<UUID> projectIdsIn(UserProfile userProfile, UUID organizationId) {
        List<UUID> projectIds = new ArrayList<>();
        userProfile.getOrganizations().stream()
                .filter(organization -> organizationId.toString().equals(organization.getId()))
                .flatMap(organization -> organization.getProjects().stream())
                .forEach(project -> projectIds.add(UUID.fromString(project.getId())));
        return projectIds;
    }
}
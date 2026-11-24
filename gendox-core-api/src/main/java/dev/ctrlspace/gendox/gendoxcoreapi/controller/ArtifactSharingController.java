package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.ArtifactSharingConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactSharingDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactSharingService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactChatResponseDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactRoleRequestDTO;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Who may open an artifact, as its share dialog sets it: general access for the agent's members, members invited
 * one by one, and a public link. Anyone who can see the artifact reads it; only its owner changes it. Signed-in
 * people only, never an API key or an agent; the service checks the artifact's access on every call.
 */
@RestController
public class ArtifactSharingController {


    private final ArtifactSharingService artifactSharingService;
    private final ArtifactSharingConverter artifactSharingConverter;
    private final SecurityUtils securityUtils;

    public ArtifactSharingController(ArtifactSharingService artifactSharingService,
                                     ArtifactSharingConverter artifactSharingConverter,
                                     SecurityUtils securityUtils) {
        this.artifactSharingService = artifactSharingService;
        this.artifactSharingConverter = artifactSharingConverter;
        this.securityUtils = securityUtils;
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @GetMapping("artifacts/{artifactId}/sharing")
    @Operation(summary = "Get who may open an artifact",
            description = "The owner, the people invited with their roles, the general access of the agent's members " +
                    "and the public link, with the signed-in user's own role. For anyone who can see the artifact.")
    public ArtifactSharingDTO getSharing(@PathVariable UUID artifactId) throws GendoxException {
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PutMapping("artifacts/{artifactId}/sharing/general-access")
    @Operation(summary = "Set the general access of an artifact",
            description = "The role every member of the agent has: VIEW, INTERACT or EDIT; a null role leaves it to the " +
                    "owner and the people invited. The owner only.")
    public ArtifactSharingDTO setGeneralAccess(@PathVariable UUID artifactId,
                                               @RequestBody ArtifactRoleRequestDTO request) throws GendoxException {
        artifactSharingService.setGeneralAccess(artifactId, securityUtils.getUserId(), request.getRole());
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PutMapping("artifacts/{artifactId}/sharing/members/{userId}")
    @Operation(summary = "Invite a member of the agent to an artifact, or change their role",
            description = "VIEW, INTERACT or EDIT. Only members of the artifact's agent, and not the owner. The owner only.")
    public ArtifactSharingDTO setMemberRole(@PathVariable UUID artifactId, @PathVariable UUID userId,
                                            @RequestBody ArtifactRoleRequestDTO request) throws GendoxException {
        artifactSharingService.setMemberRole(artifactId, securityUtils.getUserId(), userId, request.getRole());
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @DeleteMapping("artifacts/{artifactId}/sharing/members/{userId}")
    @Operation(summary = "Take back an invitation to an artifact",
            description = "Taking back one that is not there is not an error. The owner only.")
    public ArtifactSharingDTO removeMember(@PathVariable UUID artifactId, @PathVariable UUID userId)
            throws GendoxException {
        artifactSharingService.removeMember(artifactId, securityUtils.getUserId(), userId);
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PostMapping("artifacts/{artifactId}/sharing/public")
    @Operation(summary = "Make an artifact public",
            description = "Opens a view-only link to anyone, signed in or not, with the artifact's shared data. An " +
                    "artifact already public keeps its link. The owner only.")
    public ArtifactSharingDTO makePublic(@PathVariable UUID artifactId) throws GendoxException {
        artifactSharingService.makePublic(artifactId, securityUtils.getUserId());
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @DeleteMapping("artifacts/{artifactId}/sharing/public")
    @Operation(summary = "Make an artifact private",
            description = "Closes its public link at once; making it public again gives a new link. The owner only.")
    public ArtifactSharingDTO makePrivate(@PathVariable UUID artifactId) throws GendoxException {
        artifactSharingService.makePrivate(artifactId, securityUtils.getUserId());
        return sharingOf(artifactId);
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @DeleteMapping("artifacts/{artifactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an artifact for everyone",
            description = "With its versions, its invitations and the conversations' links to it. The owner only.")
    public void delete(@PathVariable UUID artifactId) throws GendoxException {
        artifactSharingService.delete(artifactId, securityUtils.getUserId());
    }

    private ArtifactSharingDTO sharingOf(UUID artifactId) throws GendoxException {
        return artifactSharingConverter.toDTO(artifactSharingService.getSharing(artifactId, securityUtils.getUserId()));
    }

    @PreAuthorize("@securityUtils.isSignedInPerson()")
    @PostMapping("artifacts/{artifactId}/chats")
    @Operation(summary = "Change an artifact in a chat",
            description = "Starts a new conversation of the signed-in user's own with the artifact's agent, opened on " +
                    "the artifact, so the agent can read and change it. For anyone with the EDIT role.")
    public ArtifactChatResponseDTO openInNewChat(@PathVariable UUID artifactId) throws GendoxException {
        return ArtifactChatResponseDTO.builder()
                .threadId(artifactSharingService.openInNewChat(artifactId, securityUtils.getUserId()).getId())
                .build();
    }
}
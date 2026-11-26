package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactAccessService.Role;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Who may open an artifact, as the share dialog sets it: general access for every member of the agent, members
 * invited one by one, and a public link. Only the owner changes these; anyone who can see the artifact sees who has
 * access. The signed-in user is always passed in, never read here.
 */
@Service
public class ArtifactSharingService {

    public static final String ROLE_CATEGORY = "ARTIFACT_ROLE";

    private final ArtifactRepository artifactRepository;
    private final ArtifactMemberRepository artifactMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ArtifactAccessService artifactAccessService;
    private final TypeService typeService;
    private final ArtifactThreadRepository artifactThreadRepository;
    private final MessageService messageService;
    private final ProjectService projectService;
    private final ArtifactService artifactService;
    private final OrganizationService organizationService;
    private final UserRepository userRepository;

    public ArtifactSharingService(ArtifactRepository artifactRepository,
                                  ArtifactMemberRepository artifactMemberRepository,
                                  ProjectMemberRepository projectMemberRepository,
                                  ArtifactAccessService artifactAccessService,
                                  TypeService typeService,
                                  ArtifactThreadRepository artifactThreadRepository,
                                  MessageService messageService,
                                  ProjectService projectService,
                                  ArtifactService artifactService,
                                  OrganizationService organizationService,
                                  UserRepository userRepository) {
        this.artifactRepository = artifactRepository;
        this.artifactMemberRepository = artifactMemberRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.artifactAccessService = artifactAccessService;
        this.typeService = typeService;
        this.artifactThreadRepository = artifactThreadRepository;
        this.messageService = messageService;
        this.projectService = projectService;
        this.artifactService = artifactService;
        this.organizationService = organizationService;
        this.userRepository = userRepository;
    }

    /**
     * What the share dialog shows: the artifact, the user's role on it, and the people invited one by one, the
     * first invited first (the owner is not among them).
     */
    public record Sharing(Artifact artifact, Role role, List<ArtifactMember> members) {
    }

    /**
     * An artifact as its public link shows it: the version, and the name of the agent that made it.
     */
    public record PublicArtifact(Artifact artifact, ArtifactVersion shown, String agentName) {
    }

    /**
     * An artifact by its public link, for anyone, signed in or not: always its latest version, and never an earlier
     * one, so what was taken out before it was made public stays out. A link of an artifact that was made private, or
     * never was public, is not found, the same as one that never existed; so is one whose agent or organization was
     * deleted, which leaves its owner no way to close it.
     */
    public PublicArtifact getPublic(UUID publicId) throws GendoxException {
        Artifact artifact = artifactRepository.findByPublicId(publicId).orElseThrow(ArtifactSharingService::noPublicArtifact);
        Project project = projectService.getProjectById(artifact.getProjectId());
        if (Boolean.FALSE.equals(project.getActive())
                || Boolean.FALSE.equals(organizationService.getById(project.getOrganizationId()).getActive())) {
            throw noPublicArtifact();
        }
        ArtifactVersion shown = artifactService.getVersion(artifact, null);
        ProjectAgent agent = project.getProjectAgent();
        String agentName = agent != null && agent.getAgentName() != null && !agent.getAgentName().isBlank()
                ? agent.getAgentName() : project.getName();
        return new PublicArtifact(artifact, shown, agentName);
    }

    /**
     * Who these users are, for the artifact's own code (gendox-core#600): only the members of the artifact's agent, as
     * the server knows it, whatever page it is opened from; anyone else among the ids is left out. For anyone who may
     * see the artifact.
     */
    public List<User> getPeople(UUID artifactId, @Nullable UUID userId, List<UUID> userIds) throws GendoxException {
        Artifact artifact = find(artifactId);
        artifactAccessService.require(artifact, userId, Role.VIEW);
        List<UUID> asked = userIds == null ? List.of() : userIds.stream().distinct().limit(200).toList();
        if (asked.isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(projectMemberRepository.findMemberIdsAmong(artifact.getProjectId(), asked));
    }

    /**
     * For anyone who may see the artifact; anyone else is told it does not exist, as for an id that was never there.
     */
    public Sharing getSharing(UUID artifactId, @Nullable UUID userId) throws GendoxException {
        Artifact artifact = find(artifactId);
        Role role = artifactAccessService.require(artifact, userId, Role.VIEW);
        return new Sharing(artifact, role, artifactMemberRepository.findAllByArtifactIdOrderByCreatedAtAsc(artifactId));
    }

    /**
     * @param roleName VIEW, INTERACT or EDIT for every member of the agent; null for only the owner and the invited
     */
    @Transactional(rollbackFor = GendoxException.class)
    public Artifact setGeneralAccess(UUID artifactId, UUID userId, @Nullable String roleName) throws GendoxException {
        Artifact artifact = findAsOwner(artifactId, userId);
        artifact.setGeneralAccessRole(roleName == null ? null : roleType(roleName));
        return artifactRepository.save(artifact);
    }

    /**
     * Invites a member of the agent with a role, or changes the role of one invited before.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public ArtifactMember setMemberRole(UUID artifactId, UUID userId, UUID memberUserId, String roleName)
            throws GendoxException {
        Artifact artifact = findAsOwner(artifactId, userId);
        if (memberUserId.equals(artifact.getOwnerId())) {
            throw new GendoxException("ARTIFACT_MEMBER_IS_OWNER",
                    "The owner always has every right on the artifact", HttpStatus.BAD_REQUEST);
        }
        if (!projectMemberRepository.existsByProjectIdAndUserId(artifact.getProjectId(), memberUserId)) {
            throw new GendoxException("ARTIFACT_MEMBER_NOT_IN_AGENT",
                    "Only members of the artifact's agent can be invited", HttpStatus.BAD_REQUEST);
        }
        Type role = roleType(roleName);
        Instant now = Instant.now();
        ArtifactMember member = artifactMemberRepository.findByArtifactIdAndUserId(artifactId, memberUserId)
                .map(existing -> existing.toBuilder().role(role).updatedBy(userId).build())
                .orElseGet(() -> ArtifactMember.builder()
                        .artifactId(artifactId)
                        .userId(memberUserId)
                        .role(role)
                        .createdAt(now)
                        .createdBy(userId)
                        .build());
        return artifactMemberRepository.save(member);
    }

    /**
     * Takes back an invitation; removing one that is not there is not an error.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public void removeMember(UUID artifactId, UUID userId, UUID memberUserId) throws GendoxException {
        findAsOwner(artifactId, userId);
        artifactMemberRepository.findByArtifactIdAndUserId(artifactId, memberUserId)
                .ifPresent(artifactMemberRepository::delete);
    }

    /**
     * Opens a view-only link to anyone. An artifact that is already public keeps its link; one made public again
     * after being private gets a new one, so an old link never opens again.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public Artifact makePublic(UUID artifactId, UUID userId) throws GendoxException {
        Artifact artifact = findAsOwner(artifactId, userId);
        if (artifact.getPublicId() != null) {
            return artifact;
        }
        artifact.setPublicId(UUID.randomUUID());
        artifact.setPublicAt(Instant.now());
        artifact.setPublicBy(userId);
        return artifactRepository.save(artifact);
    }

    /**
     * Closes the public link at once; making it private twice is not an error.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public Artifact makePrivate(UUID artifactId, UUID userId) throws GendoxException {
        Artifact artifact = findAsOwner(artifactId, userId);
        artifact.setPublicId(null);
        artifact.setPublicAt(null);
        artifact.setPublicBy(null);
        return artifactRepository.save(artifact);
    }

    /**
     * Deletes it for everyone, with its versions, its invitations and the conversations' links to it.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public void delete(UUID artifactId, UUID userId) throws GendoxException {
        artifactRepository.delete(findAsOwner(artifactId, userId));
    }

    /**
     * Change it in a chat: starts a conversation of the user's own with the artifact's agent, opened on it, so its
     * tools reach it while the user keeps the EDIT role. Nobody else sees the conversation. Each call starts a new one.
     */
    @Transactional(rollbackFor = GendoxException.class)
    public ChatThread openInNewChat(UUID artifactId, UUID userId) throws GendoxException {
        Artifact artifact = find(artifactId);
        artifactAccessService.require(artifact, userId, Role.EDIT);

        Project project = projectService.getProjectById(artifact.getProjectId());
        UUID agentUserId = project.getProjectAgent() == null ? null : project.getProjectAgent().getUserId();
        // the user and the agent, as a conversation started from New chat
        List<UUID> members = agentUserId == null ? List.of(userId) : List.of(userId, agentUserId);
        ChatThread thread = messageService.createThreadForMessage(members, artifact.getProjectId(), artifact.getTitle());

        artifactThreadRepository.save(ArtifactThread.builder()
                .artifactId(artifactId)
                .threadId(thread.getId())
                .createdAt(Instant.now())
                .createdBy(userId)
                .build());
        return thread;
    }

    private static GendoxException noPublicArtifact() {
        return new GendoxException("ARTIFACT_NOT_FOUND", "No public artifact at this link", HttpStatus.NOT_FOUND);
    }

    private Artifact find(UUID artifactId) throws GendoxException {
        return artifactRepository.findById(artifactId)
                .orElseThrow(() -> new GendoxException("ARTIFACT_NOT_FOUND",
                        "No artifact " + artifactId + " that you can open", HttpStatus.NOT_FOUND));
    }

    /**
     * The artifact, locked until the transaction ends, as every write of the artifact takes it (an update, a restore,
     * a change of who may open it): each write reads what the one before it wrote. Without it a write that read the
     * artifact before another committed would save the old values back over it - a public link made private again
     * public, or an older latest version.
     */
    private Artifact findAsOwner(UUID artifactId, UUID userId) throws GendoxException {
        Artifact artifact = artifactRepository.lockById(artifactId)
                .orElseThrow(() -> new GendoxException("ARTIFACT_NOT_FOUND",
                        "No artifact " + artifactId + " that you can open", HttpStatus.NOT_FOUND));
        artifactAccessService.require(artifact, userId, Role.OWNER);
        return artifact;
    }

    /**
     * VIEW, INTERACT or EDIT, in any case. OWNER is not a role that can be given.
     */
    private Type roleType(String roleName) throws GendoxException {
        String wanted = roleName == null ? "" : roleName.trim().toUpperCase(Locale.ROOT);
        if (!List.of("VIEW", "INTERACT", "EDIT").contains(wanted)) {
            throw new GendoxException("ARTIFACT_ROLE_NOT_SUPPORTED",
                    "Role '" + roleName + "' is not supported. Use one of: VIEW, INTERACT, EDIT", HttpStatus.BAD_REQUEST);
        }
        return typeService.getByCategoryAndName(ROLE_CATEGORY, wanted);
    }
}
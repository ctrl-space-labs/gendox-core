package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactShare;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ArtifactShareCreateRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.ArtifactShareCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ArtifactShareRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectMemberRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserOrganizationRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.ArtifactSharePredicates;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Shares of artifacts: a thread member shows one artifact, read only and without its conversation, to every member
 * of its project (PROJECT) or to one member of the organization (USER).
 * <p>
 * Who may share is decided by the caller (a signed-in member of the thread); who may open a share is decided here,
 * on every opening, so that leaving the project or the organization ends access with nothing to change in the data.
 * A share that may not be opened is not found, so a reader cannot tell it from one that does not exist.
 */
@Service
public class ArtifactShareService {

    public static final String AUDIENCE_CATEGORY = "ARTIFACT_SHARE_AUDIENCE";
    public static final String PROJECT_AUDIENCE = "PROJECT";
    public static final String USER_AUDIENCE = "USER";

    private final ArtifactRepository artifactRepository;
    private final ArtifactShareRepository artifactShareRepository;
    private final ArtifactService artifactService;
    private final TypeService typeService;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserOrganizationRepository userOrganizationRepository;
    private final UserRepository userRepository;

    // package-private for tests
    Clock clock = Clock.systemUTC();

    public ArtifactShareService(ArtifactRepository artifactRepository,
                                ArtifactShareRepository artifactShareRepository,
                                ArtifactService artifactService,
                                TypeService typeService,
                                ProjectRepository projectRepository,
                                ProjectMemberRepository projectMemberRepository,
                                UserOrganizationRepository userOrganizationRepository,
                                UserRepository userRepository) {
        this.artifactRepository = artifactRepository;
        this.artifactShareRepository = artifactShareRepository;
        this.artifactService = artifactService;
        this.typeService = typeService;
        this.projectRepository = projectRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.userOrganizationRepository = userOrganizationRepository;
        this.userRepository = userRepository;
    }

    // ---------------------------------------------------------------- the owner's side

    /**
     * Shares the artifact, replacing the active share with the same audience: the one for the whole project, or the
     * one with the same user. The artifact's row is locked meanwhile, so two shares at once replace one another in
     * turn instead of both being refused by the database.
     *
     * @param ownerId the signed-in member of the thread who shares it
     */
    @Transactional
    public ArtifactShare share(UUID threadId, UUID artifactId, UUID ownerId, ArtifactShareCreateRequestDTO request)
            throws GendoxException {
        Artifact artifact = artifactRepository.lockByIdAndThreadId(artifactId, threadId)
                .orElseThrow(() -> notFound(artifactId));
        Instant now = clock.instant();

        String audience = audienceOf(request.getAudience());
        UUID sharedWithUserId = request.getSharedWithUserId();
        if (PROJECT_AUDIENCE.equals(audience) && sharedWithUserId != null) {
            throw new GendoxException("ARTIFACT_SHARE_USER_NOT_EXPECTED",
                    "A share with the whole project names no user", HttpStatus.BAD_REQUEST);
        }
        if (USER_AUDIENCE.equals(audience)) {
            requireRecipient(artifact, ownerId, sharedWithUserId);
        }
        Integer version = request.getVersion();
        if (version != null && (version < 1 || version > artifact.getLatestVersion())) {
            throw new GendoxException("ARTIFACT_SHARE_VERSION_INVALID",
                    "The artifact's versions are 1 to " + artifact.getLatestVersion(), HttpStatus.BAD_REQUEST);
        }
        if (request.getExpiresAt() != null && !request.getExpiresAt().isAfter(now)) {
            throw new GendoxException("ARTIFACT_SHARE_EXPIRES_IN_PAST",
                    "A share can only end in the future", HttpStatus.BAD_REQUEST);
        }

        // the database allows one share per audience that is not revoked; written before the new one is added
        (sharedWithUserId == null
                ? artifactShareRepository.findByArtifact_IdAndSharedWithUserIdIsNullAndRevokedAtIsNull(artifactId)
                : artifactShareRepository.findByArtifact_IdAndSharedWithUserIdAndRevokedAtIsNull(artifactId, sharedWithUserId))
                .ifPresent(previous -> artifactShareRepository.saveAndFlush(revoked(previous, ownerId, now)));

        return artifactShareRepository.save(ArtifactShare.builder()
                .artifact(artifact)
                .version(version)
                .audienceType(typeService.getByCategoryAndName(AUDIENCE_CATEGORY, audience))
                .sharedWithUserId(sharedWithUserId)
                .expiresAt(request.getExpiresAt())
                .createdBy(ownerId)
                .build());
    }

    /** Stops a share of the artifact. Stopping one already stopped changes nothing. */
    @Transactional
    public void revoke(UUID threadId, UUID artifactId, UUID shareId, UUID userId) throws GendoxException {
        artifactService.getByIdInThread(threadId, artifactId);
        ArtifactShare share = artifactShareRepository.findById(shareId)
                .filter(found -> found.getArtifact().getId().equals(artifactId))
                .orElseThrow(() -> shareNotFound(shareId));
        if (share.getRevokedAt() == null) {
            artifactShareRepository.save(revoked(share, userId, clock.instant()));
        }
    }

    /** The artifact's shares that are active now, oldest first: what its owner sees in the Share dialog. */
    public List<ArtifactShare> getActiveShares(UUID artifactId) {
        Instant now = clock.instant();
        return artifactShareRepository.findAllByArtifact_IdAndRevokedAtIsNullOrderByCreatedAtAsc(artifactId).stream()
                .filter(share -> share.isActive(now))
                .toList();
    }

    // ---------------------------------------------------------------- the reader's side

    /**
     * The share as one reader may open it: active, and shared with them — by name while they are a member of the
     * organization, or with a project they are a member of. Its owner may open it too, to see what others see.
     * Anything else is not found.
     */
    public ArtifactShare open(UUID shareId, @Nullable UUID readerId) throws GendoxException {
        ArtifactShare share = artifactShareRepository.findById(shareId)
                .orElseThrow(() -> shareNotFound(shareId));
        if (readerId == null || !share.isActive(clock.instant()) || !canOpen(share, readerId)) {
            throw shareNotFound(shareId);
        }
        return share;
    }

    /** The version a share shows: the one it names, or the latest. */
    public ArtifactVersion versionOf(ArtifactShare share) throws GendoxException {
        return artifactService.getVersion(share.getArtifact(), share.getVersion());
    }

    /** "Shared with you": the criteria are the server's, see {@link ArtifactShareCriteria}. */
    public Page<ArtifactShare> getSharedWith(ArtifactShareCriteria criteria, Pageable pageable) {
        criteria.setActiveAt(clock.instant());
        return artifactShareRepository.findAll(ArtifactSharePredicates.build(criteria), pageable);
    }

    /** The users the given ids name, for the names a list of shares shows: one query for the whole list. */
    public Map<UUID, User> usersById(Collection<UUID> userIds) {
        List<UUID> ids = userIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    /** The organization of the share's project. */
    public UUID organizationIdOf(ArtifactShare share) throws GendoxException {
        return organizationIdOf(share.getArtifact());
    }

    // ---------------------------------------------------------------- rules

    private boolean canOpen(ArtifactShare share, UUID readerId) throws GendoxException {
        Artifact artifact = share.getArtifact();
        if (readerId.equals(share.getCreatedBy()) || readerId.equals(share.getSharedWithUserId())) {
            return userOrganizationRepository.existsByUserIdAndOrganizationId(readerId, organizationIdOf(artifact));
        }
        return share.getSharedWithUserId() == null
                && projectMemberRepository.existsByProjectIdAndUserId(artifact.getProjectId(), readerId);
    }

    private void requireRecipient(Artifact artifact, UUID ownerId, @Nullable UUID sharedWithUserId) throws GendoxException {
        if (sharedWithUserId == null) {
            throw new GendoxException("ARTIFACT_SHARE_USER_REQUIRED",
                    "A share with one user names the user", HttpStatus.BAD_REQUEST);
        }
        if (sharedWithUserId.equals(ownerId)) {
            throw new GendoxException("ARTIFACT_SHARE_WITH_SELF",
                    "An artifact cannot be shared with the one sharing it", HttpStatus.BAD_REQUEST);
        }
        if (!userOrganizationRepository.existsByUserIdAndOrganizationId(sharedWithUserId, organizationIdOf(artifact))) {
            throw new GendoxException("ARTIFACT_SHARE_USER_NOT_IN_ORGANIZATION",
                    "An artifact can be shared only with a member of its organization", HttpStatus.BAD_REQUEST);
        }
    }

    private static String audienceOf(@Nullable String audience) throws GendoxException {
        String name = audience == null ? "" : audience.trim().toUpperCase(Locale.ROOT);
        if (!PROJECT_AUDIENCE.equals(name) && !USER_AUDIENCE.equals(name)) {
            throw new GendoxException("ARTIFACT_SHARE_AUDIENCE_INVALID",
                    "The audience is PROJECT or USER", HttpStatus.BAD_REQUEST);
        }
        return name;
    }

    private UUID organizationIdOf(Artifact artifact) throws GendoxException {
        return projectRepository.findById(artifact.getProjectId())
                .map(Project::getOrganizationId)
                .orElseThrow(() -> notFound(artifact.getId()));
    }

    private static ArtifactShare revoked(ArtifactShare share, UUID userId, Instant now) {
        return share.toBuilder().revokedAt(now).revokedBy(userId).build();
    }

    private static GendoxException notFound(UUID artifactId) {
        return new GendoxException("ARTIFACT_NOT_FOUND", "No artifact " + artifactId + " in this conversation",
                HttpStatus.NOT_FOUND);
    }

    private static GendoxException shareNotFound(UUID shareId) {
        return new GendoxException("ARTIFACT_SHARE_NOT_FOUND", "No shared artifact " + shareId, HttpStatus.NOT_FOUND);
    }
}
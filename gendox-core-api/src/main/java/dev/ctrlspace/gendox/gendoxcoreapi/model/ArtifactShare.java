package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * One artifact shown, read only and without its conversation, to every member of its project (audience PROJECT)
 * or to one member of the organization (audience USER, {@link #sharedWithUserId}). Never changed after it is made,
 * except to revoke it: sharing again revokes the active share and adds a new one.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifact_shares", schema = "gendox_core")
public class ArtifactShare {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    /** Its project, organization and title are what a list of shares shows and what access is checked against. */
    @ManyToOne
    @JoinColumn(name = "artifact_id", referencedColumnName = "id", nullable = false, updatable = false)
    private Artifact artifact;

    /** The version shown; null shows the latest. */
    @Column(name = "version", updatable = false)
    private Integer version;

    /** Category ARTIFACT_SHARE_AUDIENCE: PROJECT or USER. */
    @ManyToOne
    @JoinColumn(name = "audience_type_id", referencedColumnName = "id", nullable = false, updatable = false)
    private Type audienceType;

    /** For audience USER only: the one user who may open it. */
    @Column(name = "shared_with_user_id", updatable = false)
    private UUID sharedWithUserId;

    @Column(name = "expires_at", updatable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "revoked_by")
    private UUID revokedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    /** Not revoked and not past its end. */
    public boolean isActive(Instant now) {
        return revokedAt == null && (expiresAt == null || expiresAt.isAfter(now));
    }
}
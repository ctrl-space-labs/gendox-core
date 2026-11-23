package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * A member of the agent the owner invited by name, with a role of category ARTIFACT_ROLE. Their role is the higher
 * of this and the artifact's general access. The owner is never a member row.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifact_members", schema = "gendox_core")
public class ArtifactMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "artifact_id", nullable = false, updatable = false)
    private UUID artifactId;

    /**
     * A plain id, with no foreign key: the artifact never joins with users.
     */
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /**
     * VIEW, INTERACT or EDIT.
     */
    @ManyToOne
    @JoinColumn(name = "role_id", referencedColumnName = "id", nullable = false)
    private Type role;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Set by the service from the signed-in owner.
     */
    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;
}
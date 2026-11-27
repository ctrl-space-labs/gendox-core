package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * A conversation opened on an artifact made in another one: a member's own conversation on a shared artifact.
 * Its tools reach the artifact while that member may still edit it.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifact_threads", schema = "gendox_core")
public class ArtifactThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "artifact_id", nullable = false, updatable = false)
    private UUID artifactId;

    /**
     * A plain id, with no foreign key: conversations are only ever deactivated.
     */
    @Column(name = "thread_id", nullable = false, updatable = false)
    private UUID threadId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Set by the service from the signed-in member who opened it.
     */
    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;
}
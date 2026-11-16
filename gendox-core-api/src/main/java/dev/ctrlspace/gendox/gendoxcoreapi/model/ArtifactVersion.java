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

/** The whole content of an artifact at one version. Written once, never changed. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifact_versions", schema = "gendox_core")
public class ArtifactVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "artifact_id", nullable = false, updatable = false)
    private UUID artifactId;

    /** 1, 2, 3, … within the artifact. */
    @Column(name = "version", nullable = false, updatable = false)
    private Integer version;

    @Column(name = "content", nullable = false, updatable = false)
    private String content;

    /** The assistant message whose tool call wrote this version; null once that message is deleted. */
    @Column(name = "message_id", updatable = false)
    private UUID messageId;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private UUID createdBy;
}
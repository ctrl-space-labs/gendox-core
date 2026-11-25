package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/**
 * One document an artifact wrote (gendox-core#600): what people do inside it, kept beside its versions and never as
 * one. The artifact chooses the collection, the key and the shape; the server sets who wrote it and when.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifact_data", schema = "gendox_core")
public class ArtifactData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "artifact_id", nullable = false, updatable = false)
    private UUID artifactId;

    @Column(name = "collection", nullable = false, updatable = false)
    private String collection;

    @Column(name = "doc_id", nullable = false, updatable = false)
    private String docId;

    /**
     * The document as the artifact wrote it. Written by users: only ever shown as text and read as data.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", columnDefinition = "JSONB", nullable = false)
    private JsonNode data;

    /**
     * Null: everyone who can see the artifact reads it. A user id: only that user reads and writes it.
     */
    @Column(name = "private_to", updatable = false)
    private UUID privateTo;

    /**
     * Raised on every write; a write that names an older one is refused as a conflict.
     */
    @Column(name = "revision", nullable = false)
    private Integer revision;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;
}

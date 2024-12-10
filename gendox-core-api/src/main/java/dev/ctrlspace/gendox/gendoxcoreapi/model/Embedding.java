package dev.ctrlspace.gendox.gendoxcoreapi.model;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.Type;
import java.util.Vector;

import com.pgvector.PGvector;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "embedding", schema = "gendox_core")
public class Embedding {
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private UUID id;
    @Basic
    @Type(JsonType.class)
    @Column(name = "embedding_vector", columnDefinition = "vector")
    private List<Double> embeddingVector;
    @Basic
    @Column(name = "created_at")
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at")
    @LastModifiedDate
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    @CreatedBy
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
    @LastModifiedBy
    private UUID updatedBy;
    @Basic
    @Column(name = "semantic_search_model_id")
    private UUID semanticSearchModelId;
    @Basic
    @Column(name = "project_id")
    private UUID projectId;
    @Basic
    @Column(name = "organization_id")
    private UUID organizationId;
    @Basic
    @Column(name = "section_id")
    private UUID sectionId;
    @Basic
    @Column(name = "message_id")
    private UUID messageId;


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    public List<Double> getEmbeddingVector() {
        return embeddingVector;
    }

    public void setEmbeddingVector(List<Double> embeddingVector) {
        this.embeddingVector = embeddingVector;
    }

    public UUID getSemanticSearchModelId() {
        return semanticSearchModelId;
    }

    public void setSemanticSearchModelId(UUID semanticSearchModelId) {
        this.semanticSearchModelId = semanticSearchModelId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getSectionId() {
        return sectionId;
    }

    public void setSectionId(UUID sectionId) {
        this.sectionId = sectionId;
    }

    public UUID getMessageId() {
        return messageId;
    }

    public void setMessageId(UUID messageId) {
        this.messageId = messageId;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Embedding embedding = (Embedding) o;
        return Objects.equals(id, embedding.id) && Objects.equals(embeddingVector, embedding.embeddingVector) && Objects.equals(createdAt, embedding.createdAt) && Objects.equals(updatedAt, embedding.updatedAt) && Objects.equals(createdBy, embedding.createdBy) && Objects.equals(updatedBy, embedding.updatedBy) && Objects.equals(semanticSearchModelId, embedding.semanticSearchModelId) && Objects.equals(projectId, embedding.projectId) && Objects.equals(organizationId, embedding.organizationId) && Objects.equals(sectionId, embedding.sectionId) && Objects.equals(messageId, embedding.messageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, embeddingVector, createdAt, updatedAt, createdBy, updatedBy, semanticSearchModelId, projectId, organizationId, sectionId, messageId);
    }
}

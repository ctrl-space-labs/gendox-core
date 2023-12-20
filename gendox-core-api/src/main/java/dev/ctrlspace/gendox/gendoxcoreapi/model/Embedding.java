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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Embedding embedding)) return false;
        return Objects.equals(getId(), embedding.getId()) && Objects.equals(getEmbeddingVector(), embedding.getEmbeddingVector()) && Objects.equals(getCreatedAt(), embedding.getCreatedAt()) && Objects.equals(getUpdatedAt(), embedding.getUpdatedAt()) && Objects.equals(getCreatedBy(), embedding.getCreatedBy()) && Objects.equals(getUpdatedBy(), embedding.getUpdatedBy());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getEmbeddingVector(), getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }
}

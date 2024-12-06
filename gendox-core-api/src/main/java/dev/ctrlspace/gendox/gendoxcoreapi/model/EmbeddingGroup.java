package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "embedding_group", schema = "gendox_core")
public class EmbeddingGroup {
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private UUID id;
    @Basic
    @Column(name = "section_id")
    private UUID sectionId;
    @Basic
    @Column(name = "message_id")
    private UUID messageId;
    @Basic
    @Column(name = "embedding_id")
    private UUID embeddingId;
    @Basic
    @Column(name = "token_count")
    private Double tokenCount;

//    @ManyToOne
//    @JoinColumn(name = "grouping_strategy_type_id", referencedColumnName = "id", nullable = false)
//    private Type groupingStrategyType;
//
//    @ManyToOne
//    @JoinColumn(name = "semantic_search_model_id", referencedColumnName = "id", nullable = false)
//    private Type semanticSearchModel;

    @Basic
    @Column(name = "grouping_strategy_type_id")
    private Long groupingStrategyType;

    @Basic
    @Column(name = "semantic_search_model_id")
    private UUID semanticSearchModelId;
    @Basic
    @Column(name = "embedding_sha256_hash", nullable = true)
    private String embeddingSha256Hash;

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

    public UUID getEmbeddingId() {
        return embeddingId;
    }

    public void setEmbeddingId(UUID embeddingId) {
        this.embeddingId = embeddingId;
    }

    public Double getTokenCount() {
        return tokenCount;
    }

    public void setTokenCount(Double tokenCount) {
        this.tokenCount = tokenCount;
    }

    public Long getGroupingStrategyType() {
        return groupingStrategyType;
    }

    public void setGroupingStrategyType(Long groupingStrategyType) {
        this.groupingStrategyType = groupingStrategyType;
    }

    public UUID getSemanticSearchModelId() {
        return semanticSearchModelId;
    }

    public void setSemanticSearchModelId(UUID semanticSearchModelId) {
        this.semanticSearchModelId = semanticSearchModelId;
    }

    public String getEmbeddingSha256Hash() {return embeddingSha256Hash;}

    public void setEmbeddingSha256Hash(String embeddingSha256Hash) {this.embeddingSha256Hash = embeddingSha256Hash;}

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EmbeddingGroup that = (EmbeddingGroup) o;
        return Objects.equals(id, that.id) && Objects.equals(sectionId, that.sectionId) && Objects.equals(messageId, that.messageId) && Objects.equals(embeddingId, that.embeddingId) && Objects.equals(tokenCount, that.tokenCount) && Objects.equals(groupingStrategyType, that.groupingStrategyType) && Objects.equals(semanticSearchModelId, that.semanticSearchModelId) && Objects.equals(embeddingSha256Hash, that.embeddingSha256Hash) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, sectionId, messageId, embeddingId, tokenCount, groupingStrategyType, semanticSearchModelId, embeddingSha256Hash, createdAt, updatedAt, createdBy, updatedBy);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "embedding_group", schema = "gendox_core", catalog = "postgres")
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
    @Column(name = "created_at")
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at")
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
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
        if (!(o instanceof EmbeddingGroup that)) return false;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getSectionId(), that.getSectionId()) && Objects.equals(getMessageId(), that.getMessageId()) && Objects.equals(getEmbeddingId(), that.getEmbeddingId()) && Objects.equals(getTokenCount(), that.getTokenCount()) && Objects.equals(getGroupingStrategyType(), that.getGroupingStrategyType()) && Objects.equals(getSemanticSearchModelId(), that.getSemanticSearchModelId()) && Objects.equals(getCreatedAt(), that.getCreatedAt()) && Objects.equals(getUpdatedAt(), that.getUpdatedAt()) && Objects.equals(getCreatedBy(), that.getCreatedBy()) && Objects.equals(getUpdatedBy(), that.getUpdatedBy());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getSectionId(), getMessageId(), getEmbeddingId(), getTokenCount(), getGroupingStrategyType(), getSemanticSearchModelId(), getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }
}

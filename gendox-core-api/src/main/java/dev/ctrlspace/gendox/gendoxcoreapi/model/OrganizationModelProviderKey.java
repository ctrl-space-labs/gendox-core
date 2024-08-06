package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "organization_model_provider_keys", schema = "gendox_core")
public class OrganizationModelProviderKey {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
    @ManyToOne
    @JoinColumn(name = "ai_model_provider_id", referencedColumnName = "id", nullable = false)
    private AiModelProvider aiModelProvider;
    @Basic
    @Column(name = "key", nullable = false, length = 1024)
    private String key;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
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

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public AiModelProvider getAiModelProvider() {
        return aiModelProvider;
    }

    public void setAiModelProvider(AiModelProvider aiModelProvider) {
        this.aiModelProvider = aiModelProvider;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String modelKey) {
        this.key = modelKey;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrganizationModelProviderKey that = (OrganizationModelProviderKey) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(aiModelProvider, that.aiModelProvider) && Objects.equals(key, that.key) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, aiModelProvider, key, createdAt, updatedAt);
    }
}

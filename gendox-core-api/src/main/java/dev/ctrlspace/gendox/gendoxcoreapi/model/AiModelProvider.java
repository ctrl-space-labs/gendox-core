package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "ai_model_providers", schema = "gendox_core")
public class AiModelProvider {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "name", nullable = false, length = 256)
    private String name;
    @ManyToOne
    @JoinColumn(name = "api_type_id", referencedColumnName = "id", nullable = false)
    private Type apiType;
    @Basic
    @Column(name = "description", nullable = true, length = -1)
    private String description;
    // set on an organization's own provider: the organization, and the base URL its models are called at
    @Basic
    @Column(name = "organization_id", nullable = true)
    private UUID organizationId;
    @Basic
    @Column(name = "base_url", nullable = true, length = -1)
    private String baseUrl;

    @Basic
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Type getApiType() {
        return apiType;
    }

    public void setApiType(Type apiType) {
        this.apiType = apiType;
    }



    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
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
        AiModelProvider that = (AiModelProvider) o;
        return Objects.equals(id, that.id) && Objects.equals(name, that.name) && Objects.equals(apiType, that.apiType) && Objects.equals(description, that.description) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, apiType, description, createdAt, updatedAt);
    }
}

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
@Table(name = "api_keys", schema= "gendox_core" )
public class ApiKey {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
    @Basic
    @Column(name = "name", nullable = false, length = 1024)
    private String name;
    @Basic
    @Column(name = "api_key", nullable = false, length = 1024)
    private String apiKey;
    @Basic
    @Column(name="start_date", nullable = false)
    private Instant startDate;
    @Basic
    @Column(name="end_date", nullable = false)
    private Instant endDate;
    @Basic
    @Column(name="is_active", nullable = false)
    private Boolean isActive;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public void setEndDate(Instant endDate) {
        this.endDate = endDate;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
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
        if (o == null || getClass() != o.getClass()) return false;
        ApiKey apiKey1 = (ApiKey) o;
        return Objects.equals(id, apiKey1.id) && Objects.equals(organizationId, apiKey1.organizationId) && Objects.equals(name, apiKey1.name) && Objects.equals(apiKey, apiKey1.apiKey) && Objects.equals(startDate, apiKey1.startDate) && Objects.equals(endDate, apiKey1.endDate) && Objects.equals(isActive, apiKey1.isActive) && Objects.equals(createdAt, apiKey1.createdAt) && Objects.equals(updatedAt, apiKey1.updatedAt) && Objects.equals(createdBy, apiKey1.createdBy) && Objects.equals(updatedBy, apiKey1.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, name, apiKey, startDate, endDate, isActive, createdAt, updatedAt, createdBy, updatedBy);
    }
}

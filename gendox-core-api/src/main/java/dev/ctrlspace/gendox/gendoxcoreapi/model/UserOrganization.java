package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.sql.Timestamp;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "user_organization", schema = "gendox_core")
public class UserOrganization {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
    @ManyToOne
    @JoinColumn(name = "organization_role_id", referencedColumnName = "id", nullable = false)
    private Type role;
    @Basic
    @Column(name = "created_at", nullable = true)
    private Timestamp createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Timestamp updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public Type getRole() {
        return role;
    }

    public void setRole(Type role) {
        this.role = role;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserOrganization that = (UserOrganization) o;
        return Objects.equals(id, that.id) && Objects.equals(userId, that.userId) && Objects.equals(organizationId, that.organizationId) && Objects.equals(role, that.role) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, userId, organizationId, role, createdAt, updatedAt);
    }
}

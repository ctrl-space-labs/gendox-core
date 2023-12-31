package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "user_organization", schema = "gendox_core")
public class UserOrganization {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @JsonManagedReference(value = "userOrg")
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @JsonManagedReference(value = "organizationUser")
    @ManyToOne
    @JoinColumn(name = "organization_id", referencedColumnName = "id", nullable = false)
    private Organization organization;

    @ManyToOne
    @JoinColumn(name = "organization_role_id", referencedColumnName = "id", nullable = false)
    private Type role;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    @LastModifiedDate
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Organization getOrganization() {
        return organization;
    }


    public Type getRole() {
        return role;
    }

    public void setRole(Type role) {
        this.role = role;
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

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }



    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserOrganization that = (UserOrganization) o;
        return Objects.equals(id, that.id) && Objects.equals(user, that.user) && Objects.equals(organization, that.organization) && Objects.equals(role, that.role) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, user, organization, role, createdAt, updatedAt);
    }
}

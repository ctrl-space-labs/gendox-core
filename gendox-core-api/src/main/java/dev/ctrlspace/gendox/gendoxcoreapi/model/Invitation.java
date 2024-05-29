package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "invitations", schema = "gendox_core")
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class Invitation {
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Id
    @Column(name = "id")
    private UUID id;
    @Basic
    @Column(name = "invitee_email")
    private String inviteeEmail;

    @ManyToOne
    @JoinColumn(name = "user_role_type_id", referencedColumnName = "id", nullable = false)
    private Type userRoleType;
    @Basic
    @Column(name = "token")
    @JsonIgnore
    private String token;

    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Basic
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Basic
    @Column(name = "expires_at")
    private Instant expiresAt;
    @Basic
    @Column(name = "inviter_user_id")
    private UUID inviterUserId;
    @ManyToOne
    @JoinColumn(name = "status_type_id", referencedColumnName = "id", nullable = false)
    private Type statusType;
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

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public Type getUserRoleType() {
        return userRoleType;
    }

    public void setUserRoleType(Type userRoleType) {
        this.userRoleType = userRoleType;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organization) {
        this.organizationId = organization;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID project) {
        this.projectId = project;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public UUID getInviterUserId() {
        return inviterUserId;
    }

    public void setInviterUserId(UUID inviterUserId) {
        this.inviterUserId = inviterUserId;
    }

    public Type getStatusType() {
        return statusType;
    }

    public void setStatusType(Type statusType) {
        this.statusType = statusType;
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
        Invitation that = (Invitation) o;
        return Objects.equals(id, that.id) && Objects.equals(inviteeEmail, that.inviteeEmail) && Objects.equals(userRoleType, that.userRoleType) && Objects.equals(token, that.token) && Objects.equals(organizationId, that.organizationId) && Objects.equals(projectId, that.projectId) && Objects.equals(expiresAt, that.expiresAt) && Objects.equals(inviterUserId, that.inviterUserId) && Objects.equals(statusType, that.statusType) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, inviteeEmail, userRoleType, token, organizationId, projectId, expiresAt, inviterUserId, statusType, createdAt, updatedAt, createdBy, updatedBy);
    }
}

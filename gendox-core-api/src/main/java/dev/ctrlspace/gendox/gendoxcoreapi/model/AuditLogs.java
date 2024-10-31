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
@Table(name = "audit_logs", schema = "gendox_core")
public class AuditLogs {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private UUID id;
    @Basic
    @Column(name = "project_id")
    private UUID projectId;
    @Basic
    @Column(name = "user_id")
    private UUID userId;
    @Basic
    @Column(name = "token_count")
    private Long tokenCount;
    @ManyToOne
    @JoinColumn(name = "type_id", referencedColumnName = "id", nullable = false)
    private Type type;
    @Basic
    @Column(name = "trace_id")
    private UUID traceId;
    @Basic
    @Column(name = "span_id")
    private UUID spanId;
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

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Long getTokenCount() {return tokenCount;}

    public void setTokenCount(Long tokenCount) {
        this.tokenCount = tokenCount;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public UUID getTraceId() {return traceId;}

    public void setTraceId(UUID traceId) {this.traceId = traceId;}

    public UUID getSpanId() {return spanId;}

    public void setSpanId(UUID spanId) {this.spanId = spanId;}

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
        AuditLogs auditLogs = (AuditLogs) o;
        return Objects.equals(id, auditLogs.id) && Objects.equals(projectId, auditLogs.projectId) && Objects.equals(userId, auditLogs.userId) && Objects.equals(tokenCount, auditLogs.tokenCount) && Objects.equals(type, auditLogs.type) && Objects.equals(traceId, auditLogs.traceId) && Objects.equals(spanId, auditLogs.spanId) && Objects.equals(createdAt, auditLogs.createdAt) && Objects.equals(updatedAt, auditLogs.updatedAt) && Objects.equals(createdBy, auditLogs.createdBy) && Objects.equals(updatedBy, auditLogs.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, projectId, userId, tokenCount, type, traceId, spanId, createdAt, updatedAt, createdBy, updatedBy);
    }
}

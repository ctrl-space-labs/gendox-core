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
@Table(name = "task_edges", schema = "gendox_core")
public class TaskEdge {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_node_id", nullable = false)
    private TaskNode fromNode;

    @Basic
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_node_id", nullable = false)
    private TaskNode toNode;

    @Basic
    @ManyToOne
    @JoinColumn(name = "relation_type_id", referencedColumnName = "id", nullable = false)
    private Type relationType;

    @Basic
    @Column(name = "created_at", nullable = false)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = false)
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

    public TaskNode getFromNode() {
        return fromNode;
    }

    public void setFromNode(TaskNode fromNode) {
        this.fromNode = fromNode;
    }

    public TaskNode getToNode() {
        return toNode;
    }

    public void setToNode(TaskNode toNode) {
        this.toNode = toNode;
    }

    public Type getRelationType() {
        return relationType;
    }

    public void setRelationType(Type relationType) {
        this.relationType = relationType;
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
        TaskEdge taskEdge = (TaskEdge) o;
        return Objects.equals(id, taskEdge.id) && Objects.equals(fromNode, taskEdge.fromNode) && Objects.equals(toNode, taskEdge.toNode) && Objects.equals(relationType, taskEdge.relationType) && Objects.equals(createdAt, taskEdge.createdAt) && Objects.equals(updatedAt, taskEdge.updatedAt) && Objects.equals(createdBy, taskEdge.createdBy) && Objects.equals(updatedBy, taskEdge.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, fromNode, toNode, relationType, createdAt, updatedAt, createdBy, updatedBy);
    }
}

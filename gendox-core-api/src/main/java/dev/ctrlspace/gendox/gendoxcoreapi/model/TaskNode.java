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
@Table(name = "task_nodes", schema = "gendox_core")
public class TaskNode {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @JoinColumn(name = "task_id", nullable = false)
    private UUID taskId;

    @Basic
    @ManyToOne
    @JoinColumn(name = "node_type_id", referencedColumnName = "id", nullable = false)
    private Type nodeType;

    @Basic
    @Column(name = "content_text")
    private String content;

    @Basic
    @Column(name = "parent_node_id")
    private UUID parentNodeId;

    @Basic
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private DocumentInstance document;

    @Basic
    @Column(name = "page_number")
    private Integer pageNumber;

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

    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public Type getNodeType() {
        return nodeType;
    }

    public void setNodeType(Type nodeType) {
        this.nodeType = nodeType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public UUID getParentNodeId() {
        return parentNodeId;
    }

    public void setParentNodeId(UUID parentNodeId) {
        this.parentNodeId = parentNodeId;
    }

    public DocumentInstance getDocument() {
        return document;
    }

    public void setDocument(DocumentInstance document) {
        this.document = document;
    }

    public Integer getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
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
        TaskNode taskNode = (TaskNode) o;
        return Objects.equals(id, taskNode.id) && Objects.equals(taskId, taskNode.taskId) && Objects.equals(nodeType, taskNode.nodeType) && Objects.equals(content, taskNode.content) && Objects.equals(parentNodeId, taskNode.parentNodeId) && Objects.equals(document, taskNode.document) && Objects.equals(pageNumber, taskNode.pageNumber) && Objects.equals(createdAt, taskNode.createdAt) && Objects.equals(updatedAt, taskNode.updatedAt) && Objects.equals(createdBy, taskNode.createdBy) && Objects.equals(updatedBy, taskNode.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, taskId, nodeType, content, parentNodeId, document, pageNumber, createdAt, updatedAt, createdBy, updatedBy);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "chat_thread", schema = "gendox_core")
public class ChatThread {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;
    @Basic
    @Column(name = "name")
    private String name;
    @Basic
    @Column(name = "project_id")
    private UUID projectId;
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

    @JsonManagedReference(value = "chatThread")
    @OneToMany(mappedBy = "chatThread")
    private List<ChatThreadMember> chatThreadMembers = new ArrayList<>();

    @Basic
    @Column(name = "public_thread", columnDefinition = "boolean default false", nullable = false)
    private Boolean publicThread = false; // default value

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

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
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


    public List<ChatThreadMember> getChatThreadMembers() {
        return chatThreadMembers;
    }

    public void setChatThreadMembers(List<ChatThreadMember> chatThreadMembers) {
        this.chatThreadMembers = chatThreadMembers;
    }

    public Boolean getPublicThread() {
        return publicThread;
    }

    public void setPublicThread(Boolean isPublicThread) {
        this.publicThread = isPublicThread;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatThread that = (ChatThread) o;
        return Objects.equals(id, that.id) && Objects.equals(name, that.name) && Objects.equals(projectId, that.projectId) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy) && Objects.equals(chatThreadMembers, that.chatThreadMembers) && Objects.equals(publicThread, that.publicThread);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, projectId, createdAt, updatedAt, createdBy, updatedBy, chatThreadMembers, publicThread);
    }
}

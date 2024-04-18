package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;


import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "message", schema = "gendox_core")
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class Message {
    //    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id")
    private UUID id;
    @Basic
    @Column(name = "value")
    private String value;
    @Basic
    @Column(name = "project_id")
    private UUID projectId;
    @Basic
    @Column(name = "thread_id")
    private UUID threadId;
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


    //    @JsonBackReference(value = "message")
    @JsonManagedReference(value = "message")
    @OneToMany(mappedBy = "message")
    private List<MessageSection> messageSections;


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
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

    public UUID getThreadId() {
        return threadId;
    }

    public void setThreadId(UUID threadId) {
        this.threadId = threadId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public List<MessageSection> getMessageSections() {
        return messageSections;
    }

    public void setMessageSections(List<MessageSection> messageSections) {
        this.messageSections = messageSections;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Message message)) return false;
        return Objects.equals(getId(), message.getId()) && Objects.equals(getValue(), message.getValue()) && Objects.equals(getProjectId(), message.getProjectId()) && Objects.equals(getThreadId(), message.getThreadId()) && Objects.equals(getCreatedAt(), message.getCreatedAt()) && Objects.equals(getUpdatedAt(), message.getUpdatedAt()) && Objects.equals(getCreatedBy(), message.getCreatedBy()) && Objects.equals(getUpdatedBy(), message.getUpdatedBy());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getValue(), getProjectId(), getThreadId(), getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;


import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "message", schema = "gendox_core", catalog = "postgres")
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
    @Column(name = "thread_id")
    private UUID threadId;
    @Basic
    @Column(name = "created_at")
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at")
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Message message)) return false;
        return Objects.equals(getId(), message.getId()) && Objects.equals(getValue(), message.getValue()) && Objects.equals(getThreadId(), message.getThreadId()) && Objects.equals(getCreatedAt(), message.getCreatedAt()) && Objects.equals(getUpdatedAt(), message.getUpdatedAt()) && Objects.equals(getCreatedBy(), message.getCreatedBy()) && Objects.equals(getUpdatedBy(), message.getUpdatedBy());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getValue(), getThreadId(), getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }
}

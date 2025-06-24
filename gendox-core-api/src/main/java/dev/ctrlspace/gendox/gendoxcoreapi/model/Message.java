package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageLocalContext;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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
    @Basic
    @Column(name = "role")
    private String role;
    // the name of the tool to called in this message, if any
    @Basic
    @Column(name = "name")
    private String name;
    @Basic
    @Column(name = "tool_call_id")
    private String toolCallId;

    // if assistant message contains tool calls, this field will contain the json representation of the tool calls
    @JdbcTypeCode(SqlTypes.JSON)        // transform it to jsonb in postgresql
    @Column(name = "tool_calls", columnDefinition = "JSONB")
    private JsonNode toolCalls;




    //    @JsonBackReference(value = "message")
    @JsonManagedReference(value = "message")
    @OneToMany(mappedBy = "message")
    private List<MessageSection> messageSections;

    // TODO save this to database, find better name
    @Transient
    @JsonProperty("localContexts")
    private List<MessageLocalContext> localContexts;


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

    public List<MessageLocalContext> getLocalContexts() {
        return localContexts;
    }

    public void setLocalContexts(List<MessageLocalContext> localContexts) {
        this.localContexts = localContexts;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getToolCallId() {
        return toolCallId;
    }

    public void setToolCallId(String toolCallId) {
        this.toolCallId = toolCallId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public JsonNode getToolCalls() {
        return toolCalls;
    }

    public void setToolCalls(JsonNode toolCalls) {
        this.toolCalls = toolCalls;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Message message = (Message) o;
        return Objects.equals(id, message.id) && Objects.equals(value, message.value) && Objects.equals(projectId, message.projectId) && Objects.equals(threadId, message.threadId) && Objects.equals(createdAt, message.createdAt) && Objects.equals(updatedAt, message.updatedAt) && Objects.equals(createdBy, message.createdBy) && Objects.equals(updatedBy, message.updatedBy) && Objects.equals(role, message.role) && Objects.equals(name, message.name) && Objects.equals(toolCallId, message.toolCallId) && Objects.equals(toolCalls, message.toolCalls) && Objects.equals(messageSections, message.messageSections) && Objects.equals(localContexts, message.localContexts);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, value, projectId, threadId, createdAt, updatedAt, createdBy, updatedBy, role, name, toolCallId, toolCalls, messageSections, localContexts);
    }
}

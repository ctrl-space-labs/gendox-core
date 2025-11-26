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
@Table(name = "tasks", schema = "gendox_core")
public class Task {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Basic
    @ManyToOne
    @JoinColumn(name = "task_type_id", referencedColumnName = "id", nullable = false)
    private Type taskType;

    @Basic
    @Column(name = "title")
    private String title;
    @Basic
    @Column(name = "description")
    private String description;

    @Basic
    @Column(name="status")
    private String status;

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

    @ManyToOne
    @JoinColumn(name = "completion_model_id", referencedColumnName = "id", nullable = true)
    private AiModel completionModel;
    @Basic
    @Column(name = "task_prompt", nullable = true, length = -1)
    private String taskPrompt;
    @Basic
    @Column(name = "max_token", nullable = true)
    private Long maxToken;
    @Basic
    @Column(name = "temperature", nullable = true)
    private Double temperature;
    @Basic
    @Column(name = "top_p", nullable = true)
    private Double topP;


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

    public Type getTaskType() {
        return taskType;
    }

    public void setTaskType(Type taskType) {
        this.taskType = taskType;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AiModel getCompletionModel() {
        return completionModel;
    }

    public void setCompletionModel(AiModel completionModel) {
        this.completionModel = completionModel;
    }

    public String getTaskPrompt() {
        return taskPrompt;
    }

    public void setTaskPrompt(String taskPrompt) {
        this.taskPrompt = taskPrompt;
    }

    public Long getMaxToken() {
        return maxToken;
    }

    public void setMaxToken(Long maxToken) {
        this.maxToken = maxToken;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getTopP() {
        return topP;
    }

    public void setTopP(Double topP) {
        this.topP = topP;
    }


    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Task task = (Task) o;
        return Objects.equals(id, task.id) && Objects.equals(projectId, task.projectId) && Objects.equals(taskType, task.taskType) && Objects.equals(title, task.title) && Objects.equals(description, task.description) && Objects.equals(status, task.status) && Objects.equals(createdAt, task.createdAt) && Objects.equals(updatedAt, task.updatedAt) && Objects.equals(createdBy, task.createdBy) && Objects.equals(updatedBy, task.updatedBy) && Objects.equals(completionModel, task.completionModel) && Objects.equals(taskPrompt, task.taskPrompt) && Objects.equals(maxToken, task.maxToken) && Objects.equals(temperature, task.temperature) && Objects.equals(topP, task.topP);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, projectId, taskType, title, description, status, createdAt, updatedAt, createdBy, updatedBy, completionModel, taskPrompt, maxToken, temperature, topP);
    }
}

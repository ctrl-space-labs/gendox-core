package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;

import org.hibernate.type.SqlTypes;
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
@Table(name = "integrations", schema = "gendox_core")
public class Integration {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "organization_id")
    private UUID organizationId;
    @Basic
    @Column(name = "project_id")
    private UUID projectId;
    @ManyToOne
    @JoinColumn(name = "type_id", referencedColumnName = "id", nullable = false)
    private Type integrationType;
    @Basic
    @Column(name = "is_active", nullable = true)
    private Boolean isActive;
    @Basic
    @Column(name = "url")
    private String url;
    @Basic
    @Column(name = "queue_name")
    private String queueName;
    @Basic
    @Column(name = "directory_path")
    private String directoryPath;
    @Basic
    @Column(name = "repository_head")
    private String repoHead;
    @Basic
    @Column(name = "user_name")
    private String userName;
    @Basic
    @Column(name = "password")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    @Basic
    @Column(name = "run_interval_minutes")
    private Integer runIntervalMinutes;
    @Basic
    @Column(name = "last_run_at")
    private Instant lastRunAt;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", nullable = false, columnDefinition = "JSONB")
    private String config;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
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

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public Type getIntegrationType() {
        return integrationType;
    }

    public void setIntegrationType(Type integrationType) {
        this.integrationType = integrationType;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getQueueName() {
        return queueName;
    }

    public void setQueueName(String queueName) {
        this.queueName = queueName;
    }

    public String getDirectoryPath() {
        return directoryPath;
    }

    public void setDirectoryPath(String directoryPath) {
        this.directoryPath = directoryPath;
    }

    public String getRepoHead() {
        return repoHead;
    }

    public void setRepoHead(String repoHead) {
        this.repoHead = repoHead;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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

    public Integer getRunIntervalMinutes() {
        return runIntervalMinutes;
    }

    public void setRunIntervalMinutes(Integer runIntervalMinutes) {
        this.runIntervalMinutes = runIntervalMinutes;
    }

    public Instant getLastRunAt() {
        return lastRunAt;
    }

    public void setLastRunAt(Instant lastRunAt) {
        this.lastRunAt = lastRunAt;
    }

    public String getConfig() {
        return config;
    }

    public void setConfig(String config) {
        this.config = config;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        Integration that = (Integration) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(projectId, that.projectId) && Objects.equals(integrationType, that.integrationType) && Objects.equals(isActive, that.isActive) && Objects.equals(url, that.url) && Objects.equals(queueName, that.queueName) && Objects.equals(directoryPath, that.directoryPath) && Objects.equals(repoHead, that.repoHead) && Objects.equals(userName, that.userName) && Objects.equals(password, that.password) && Objects.equals(runIntervalMinutes, that.runIntervalMinutes) && Objects.equals(lastRunAt, that.lastRunAt) && Objects.equals(config, that.config) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, projectId, integrationType, isActive, url, queueName, directoryPath, repoHead, userName, password, runIntervalMinutes, lastRunAt, config, createdAt, updatedAt, createdBy, updatedBy);
    }
}

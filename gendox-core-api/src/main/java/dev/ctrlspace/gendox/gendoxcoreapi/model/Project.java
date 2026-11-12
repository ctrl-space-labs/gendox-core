package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
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
@Table(name = "projects", schema = "gendox_core")
public class Project {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
    @Basic
    @Column(name = "name", nullable = false, length = -1)
    private String name;
    @Basic
    @Column(name = "description", nullable = true, length = -1)
    private String description;
    @Basic
    @Column(name = "is_active", nullable = true)
    private Boolean isActive;
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

    @Schema(hidden = true)
    @JsonBackReference(value = "project")
    @OneToMany(mappedBy = "project")
    private List<ProjectMember> projectMembers;

    @JsonManagedReference(value = "agent")
    @OneToOne(mappedBy = "project")
    private ProjectAgent projectAgent;

    @Schema(hidden = true)
    @JsonBackReference(value = "project")
    @OneToMany(mappedBy = "project")
    private List<ProjectDocument> projectDocuments ;

    @Basic
    @Column(name = "auto_training")
    private Boolean autoTraining;


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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getActive() {
        return isActive;
    }

    public void setActive(Boolean active) {
        isActive = active;
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

    public List<ProjectMember> getProjectMembers() {
        return projectMembers;
    }

    public void setProjectMembers(List<ProjectMember> projectMembers) {
        this.projectMembers = projectMembers;
    }

    public ProjectAgent getProjectAgent() {
        return projectAgent;
    }

    public void setProjectAgent(ProjectAgent projectAgent) {
        this.projectAgent = projectAgent;
    }

    public List<ProjectDocument> getProjectDocuments() {
        return projectDocuments;
    }

    public void setProjectDocuments(List<ProjectDocument> projectDocuments) {
        this.projectDocuments = projectDocuments;
    }

    public Boolean getAutoTraining() {
        return autoTraining;
    }

    public void setAutoTraining(Boolean autoTraining) {
        this.autoTraining = autoTraining;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Project project = (Project) o;
        return Objects.equals(id, project.id) && Objects.equals(organizationId, project.organizationId) && Objects.equals(name, project.name) && Objects.equals(description, project.description) && Objects.equals(isActive, project.isActive) && Objects.equals(createdAt, project.createdAt) && Objects.equals(updatedAt, project.updatedAt) && Objects.equals(createdBy, project.createdBy) && Objects.equals(updatedBy, project.updatedBy) && Objects.equals(projectMembers, project.projectMembers) && Objects.equals(projectAgent, project.projectAgent) && Objects.equals(projectDocuments, project.projectDocuments) && Objects.equals(autoTraining, project.autoTraining);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, name, description, isActive, createdAt, updatedAt, createdBy, updatedBy, projectMembers, projectAgent, projectDocuments, autoTraining);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
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
    @Column(name = "created_at", nullable = true)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
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

    public List<ProjectMember> getProjectMembers() {
        return projectMembers;
    }

    public void setProjectMembers(List<ProjectMember> projectMembers) {
        this.projectMembers = projectMembers;
    }

    public ProjectAgent getProjectAgent() {
        return projectAgent;
    }

    public void setProjectAgent(ProjectAgent projectAgents) {
        this.projectAgent = projectAgents;
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

        if (!Objects.equals(id, project.id)) return false;
        if (!Objects.equals(organizationId, project.organizationId))
            return false;
        if (!Objects.equals(name, project.name)) return false;
        if (!Objects.equals(description, project.description)) return false;
        if (!Objects.equals(createdAt, project.createdAt)) return false;
        if (!Objects.equals(updatedAt, project.updatedAt)) return false;
        if (!Objects.equals(createdBy, project.createdBy)) return false;
        if (!Objects.equals(updatedBy, project.updatedBy)) return false;
        if (!Objects.equals(projectMembers, project.projectMembers))
            return false;
        if (!Objects.equals(projectAgent, project.projectAgent))
            return false;
        if (!Objects.equals(projectDocuments, project.projectDocuments))
            return false;
        return Objects.equals(autoTraining, project.autoTraining);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (organizationId != null ? organizationId.hashCode() : 0);
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        result = 31 * result + (createdBy != null ? createdBy.hashCode() : 0);
        result = 31 * result + (updatedBy != null ? updatedBy.hashCode() : 0);
        result = 31 * result + (projectMembers != null ? projectMembers.hashCode() : 0);
        result = 31 * result + (projectAgent != null ? projectAgent.hashCode() : 0);
        result = 31 * result + (projectDocuments != null ? projectDocuments.hashCode() : 0);
        result = 31 * result + (autoTraining != null ? autoTraining.hashCode() : 0);
        return result;
    }
}

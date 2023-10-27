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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Project project)) return false;
        return Objects.equals(getId(), project.getId()) && Objects.equals(getOrganizationId(), project.getOrganizationId()) && Objects.equals(getName(), project.getName()) && Objects.equals(getDescription(), project.getDescription()) && Objects.equals(getCreatedAt(), project.getCreatedAt()) && Objects.equals(getUpdatedAt(), project.getUpdatedAt()) && Objects.equals(getCreatedBy(), project.getCreatedBy()) && Objects.equals(getUpdatedBy(), project.getUpdatedBy()) && Objects.equals(getProjectMembers(), project.getProjectMembers()) && Objects.equals(getProjectAgent(), project.getProjectAgent()) && Objects.equals(projectDocuments, project.projectDocuments);
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getOrganizationId(), getName(), getDescription(), getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy(), getProjectMembers(), getProjectAgent(), projectDocuments);
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
@Table(name = "document_instance", schema = "gendox_core")
public class DocumentInstance {
    //@GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
    @Basic
    @Column(name = "document_template_id", nullable = true)
    private UUID documentTemplateId;

    @Basic
    @Column(name = "remote_url", nullable = true, length = -1)
    private String remoteUrl;
    @Basic
    @Column(name="created_by", nullable = true)
    @CreatedBy
    private UUID createdBy;
    @Basic
    @Column(name="updated_by", nullable = true)
    @LastModifiedBy
    private UUID updatedBy;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    @LastModifiedDate
    private Instant updatedAt;

    @JsonManagedReference(value = "DocumentInstanceSection")
    @OneToMany(mappedBy = "documentInstance")
    private List<DocumentInstanceSection> documentInstanceSections;

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

    public UUID getDocumentTemplateId() {
        return documentTemplateId;
    }

    public void setDocumentTemplateId(UUID documentTemplateId) {
        this.documentTemplateId = documentTemplateId;
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

    public List<DocumentInstanceSection> getDocumentInstanceSections() {
        return documentInstanceSections;
    }

    public void setDocumentInstanceSections(List<DocumentInstanceSection> documentInstanceSections) {
        this.documentInstanceSections = documentInstanceSections;
    }

    public String getRemoteUrl() {
        return remoteUrl;
    }

    public void setRemoteUrl(String remoteUrl) {
        this.remoteUrl = remoteUrl;
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

        DocumentInstance that = (DocumentInstance) o;

        if (!Objects.equals(id, that.id)) return false;
        if (!Objects.equals(organizationId, that.organizationId))
            return false;
        if (!Objects.equals(documentTemplateId, that.documentTemplateId))
            return false;

        if (!Objects.equals(createdAt, that.createdAt)) return false;
        if (!Objects.equals(updatedAt, that.updatedAt)) return false;
        return Objects.equals(documentInstanceSections, that.documentInstanceSections);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (organizationId != null ? organizationId.hashCode() : 0);
        result = 31 * result + (documentTemplateId != null ? documentTemplateId.hashCode() : 0);

        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        result = 31 * result + (documentInstanceSections != null ? documentInstanceSections.hashCode() : 0);
        return result;
    }
}

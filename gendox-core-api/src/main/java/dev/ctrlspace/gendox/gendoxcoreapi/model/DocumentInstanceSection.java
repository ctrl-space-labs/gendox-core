package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "document_instance_sections", schema = "gendox_core")
public class DocumentInstanceSection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "document_instance_id", nullable = false)
    private UUID documentInstanceId;
    @Basic
    @Column(name = "document_section_metadata_id", nullable = false)
    private UUID documentSectionMetadataId;
    @Basic
    @Column(name = "section_value", nullable = true, length = -1)
    private String sectionValue;
    @Basic
    @Column(name = "remote_url", nullable = true, length = -1)
    private String remoteUrl;
    @Basic
    @Column(name = "created_at", nullable = true)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getDocumentInstanceId() {
        return documentInstanceId;
    }

    public void setDocumentInstanceId(UUID documentInstanceId) {
        this.documentInstanceId = documentInstanceId;
    }

    public UUID getDocumentSectionMetadataId() {
        return documentSectionMetadataId;
    }

    public void setDocumentSectionMetadataId(UUID documentSectionTemplateId) {
        this.documentSectionMetadataId = documentSectionTemplateId;
    }

    public String getSectionValue() {
        return sectionValue;
    }

    public void setSectionValue(String sectionValue) {
        this.sectionValue = sectionValue;
    }

    public String getRemoteUrl() {
        return remoteUrl;
    }

    public void setRemoteUrl(String remoteUrl) {
        this.remoteUrl = remoteUrl;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        DocumentInstanceSection that = (DocumentInstanceSection) o;

        if (id != null ? !id.equals(that.id) : that.id != null) return false;
        if (documentInstanceId != null ? !documentInstanceId.equals(that.documentInstanceId) : that.documentInstanceId != null)
            return false;
        if (documentSectionMetadataId != null ? !documentSectionMetadataId.equals(that.documentSectionMetadataId) : that.documentSectionMetadataId != null)
            return false;
        if (sectionValue != null ? !sectionValue.equals(that.sectionValue) : that.sectionValue != null) return false;
        if (remoteUrl != null ? !remoteUrl.equals(that.remoteUrl) : that.remoteUrl != null) return false;
        if (createdAt != null ? !createdAt.equals(that.createdAt) : that.createdAt != null) return false;
        if (updatedAt != null ? !updatedAt.equals(that.updatedAt) : that.updatedAt != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (documentInstanceId != null ? documentInstanceId.hashCode() : 0);
        result = 31 * result + (documentSectionMetadataId != null ? documentSectionMetadataId.hashCode() : 0);
        result = 31 * result + (sectionValue != null ? sectionValue.hashCode() : 0);
        result = 31 * result + (remoteUrl != null ? remoteUrl.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        return result;
    }
}

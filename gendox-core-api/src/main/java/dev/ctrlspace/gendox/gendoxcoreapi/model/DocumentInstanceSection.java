package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "document_instance_sections", schema = "gendox_core")
public class DocumentInstanceSection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @JsonBackReference(value = "DocumentInstanceSection")
    @ManyToOne
    @JoinColumn(name = "document_instance_id", referencedColumnName = "id", nullable = false)
    private DocumentInstance documentInstance;

    @JsonManagedReference(value = "DocumentSectionMetadata")
    @ManyToOne
    @JoinColumn(name = "document_section_metadata_id", referencedColumnName = "id", nullable = false)
    private DocumentSectionMetadata documentSectionMetadata;
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

    public DocumentInstance getDocumentInstance() {
        return documentInstance;
    }

    public void setDocumentInstance(DocumentInstance documentInstance) {
        this.documentInstance = documentInstance;
    }

    public DocumentSectionMetadata getDocumentSectionMetadata() {
        return documentSectionMetadata;
    }

    public void setDocumentSectionMetadata(DocumentSectionMetadata documentSectionMetadata) {
        this.documentSectionMetadata = documentSectionMetadata;
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

        if (!Objects.equals(id, that.id)) return false;
        if (!Objects.equals(documentInstance, that.documentInstance))
            return false;
        if (!Objects.equals(documentSectionMetadata, that.documentSectionMetadata))
            return false;
        if (!Objects.equals(sectionValue, that.sectionValue)) return false;
        if (!Objects.equals(remoteUrl, that.remoteUrl)) return false;
        if (!Objects.equals(createdAt, that.createdAt)) return false;
        return Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (documentInstance != null ? documentInstance.hashCode() : 0);
        result = 31 * result + (documentSectionMetadata != null ? documentSectionMetadata.hashCode() : 0);
        result = 31 * result + (sectionValue != null ? sectionValue.hashCode() : 0);
        result = 31 * result + (remoteUrl != null ? remoteUrl.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        return result;
    }
}

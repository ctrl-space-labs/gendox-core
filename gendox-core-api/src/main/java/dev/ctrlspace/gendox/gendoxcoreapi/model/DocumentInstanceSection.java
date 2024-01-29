package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
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
    @Column(name="has_content_warning", nullable = true)
    private Boolean hasContentWarning;

    @Basic
    @Column(name = "section_iscc_code", nullable = false)
    private String documentSectionIsccCode;

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

    public String getDocumentSectionIsccCode() {
        return documentSectionIsccCode;
    }

    public void setDocumentSectionIsccCode(String documentSectionIsccCode) {
        this.documentSectionIsccCode = documentSectionIsccCode;
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

    public Boolean getModerationFlagged() {
        return hasContentWarning;
    }

    public void setModerationFlagged(Boolean moderationFlagged) {
        hasContentWarning = moderationFlagged;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DocumentInstanceSection that = (DocumentInstanceSection) o;
        return Objects.equals(id, that.id) && Objects.equals(documentInstance, that.documentInstance) && Objects.equals(documentSectionMetadata, that.documentSectionMetadata) && Objects.equals(sectionValue, that.sectionValue) && Objects.equals(hasContentWarning, that.hasContentWarning) && Objects.equals(documentSectionIsccCode, that.documentSectionIsccCode) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, documentInstance, documentSectionMetadata, sectionValue, hasContentWarning, documentSectionIsccCode, createdBy, updatedBy, createdAt, updatedAt);
    }
}

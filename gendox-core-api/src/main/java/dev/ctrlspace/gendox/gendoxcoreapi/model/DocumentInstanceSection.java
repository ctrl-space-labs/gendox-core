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
    @Column(name="has_content_warning", nullable = true)
    private Boolean hasContentWarning;

    @Basic
    @Column(name="created_by", nullable = true)
    private UUID createdBy;
    @Basic
    @Column(name="updated_by", nullable = true)
    private UUID updatedBy;

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
        if (!(o instanceof DocumentInstanceSection section)) return false;
        return Objects.equals(getId(), section.getId()) && Objects.equals(getDocumentInstance(), section.getDocumentInstance()) && Objects.equals(getDocumentSectionMetadata(), section.getDocumentSectionMetadata()) && Objects.equals(getSectionValue(), section.getSectionValue()) && Objects.equals(hasContentWarning, section.hasContentWarning) && Objects.equals(getCreatedBy(), section.getCreatedBy()) && Objects.equals(getUpdatedBy(), section.getUpdatedBy()) && Objects.equals(getCreatedAt(), section.getCreatedAt()) && Objects.equals(getUpdatedAt(), section.getUpdatedAt());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getDocumentInstance(), getDocumentSectionMetadata(), getSectionValue(), hasContentWarning, getCreatedBy(), getUpdatedBy(), getCreatedAt(), getUpdatedAt());
    }
}

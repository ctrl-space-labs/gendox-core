package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "document_section_metadata", schema = "gendox_core")
public class DocumentSectionMetadata {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "document_template_id", nullable = true)
    private UUID documentTemplateId;
    @Basic
    @Column(name = "document_section_type_id", nullable = false)
    private Long documentSectionTypeId;
    @Basic
    @Column(name = "title", nullable = true, length = -1)
    private String title;
    @Basic
    @Column(name = "description", nullable = true, length = -1)
    private String description;
    @Basic
    @Column(name = "section_options", nullable = true, length = -1)
    private String sectionOptions;
    @Basic
    @Column(name = "section_order", nullable = false)
    private Integer sectionOrder;
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

    @JsonBackReference(value = "DocumentSectionMetadata")
    @OneToMany(mappedBy = "documentSectionMetadata")
    private List<DocumentInstanceSection> documentInstanceSections;


    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getDocumentTemplateId() {
        return documentTemplateId;
    }

    public void setDocumentTemplateId(UUID documentTemplateId) {
        this.documentTemplateId = documentTemplateId;
    }

    public Long getDocumentSectionTypeId() {
        return documentSectionTypeId;
    }

    public void setDocumentSectionTypeId(Long documentSectionTypeId) {
        this.documentSectionTypeId = documentSectionTypeId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSectionOptions() {
        return sectionOptions;
    }

    public void setSectionOptions(String sectionOptions) {
        this.sectionOptions = sectionOptions;
    }

    public Integer getSectionOrder() {
        return sectionOrder;
    }

    public void setSectionOrder(Integer sectionOrder) {
        this.sectionOrder = sectionOrder;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        DocumentSectionMetadata that = (DocumentSectionMetadata) o;

        if (id != null ? !id.equals(that.id) : that.id != null) return false;
        if (documentTemplateId != null ? !documentTemplateId.equals(that.documentTemplateId) : that.documentTemplateId != null)
            return false;
        if (documentSectionTypeId != null ? !documentSectionTypeId.equals(that.documentSectionTypeId) : that.documentSectionTypeId != null)
            return false;
        if (title != null ? !title.equals(that.title) : that.title != null) return false;
        if (description != null ? !description.equals(that.description) : that.description != null) return false;
        if (sectionOptions != null ? !sectionOptions.equals(that.sectionOptions) : that.sectionOptions != null)
            return false;
        if (sectionOrder != null ? !sectionOrder.equals(that.sectionOrder) : that.sectionOrder != null) return false;
        if (createdAt != null ? !createdAt.equals(that.createdAt) : that.createdAt != null) return false;
        if (updatedAt != null ? !updatedAt.equals(that.updatedAt) : that.updatedAt != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (documentTemplateId != null ? documentTemplateId.hashCode() : 0);
        result = 31 * result + (documentSectionTypeId != null ? documentSectionTypeId.hashCode() : 0);
        result = 31 * result + (title != null ? title.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        result = 31 * result + (sectionOptions != null ? sectionOptions.hashCode() : 0);
        result = 31 * result + (sectionOrder != null ? sectionOrder.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        return result;
    }
}

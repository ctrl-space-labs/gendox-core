package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.checkerframework.checker.units.qual.C;
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
    @Column(name = "remote_url", nullable = true)
    private String remoteUrl;

    @Basic
    @Column(name = "document_iscc_code", nullable = false)
    private String documentIsccCode;
    @Basic
    @Column(name = "document_sha256_hash", nullable = true)
    private String documentSha256Hash;

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

    @ManyToOne
    @JoinColumn(name = "file_type_id", referencedColumnName = "id")
    private Type fileType;

    @Basic
    @Column(name = "content_id")
    private Long contentId;

    @Basic
    @Column(name = "external_url")
    private String externalUrl;

    @Basic
    @Column(name = "title")
    private String title;

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

    public String getRemoteUrl() {
        return remoteUrl;
    }

    public void setRemoteUrl(String remoteUrl) {
        this.remoteUrl = remoteUrl;
    }

    public String getDocumentIsccCode() {
        return documentIsccCode;
    }

    public void setDocumentIsccCode(String documentIsccCode) {
        this.documentIsccCode = documentIsccCode;
    }

    public String getDocumentSha256Hash() {
        return documentSha256Hash;
    }

    public void setDocumentSha256Hash(String documentSha256Hash) {
        this.documentSha256Hash = documentSha256Hash;
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

    public Type getFileType() {
        return fileType;
    }

    public void setFileType(Type fileType) {
        this.fileType = fileType;
    }

    public Long getContentId() {
        return contentId;
    }

    public void setContentId(Long contentId) {
        this.contentId = contentId;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public List<DocumentInstanceSection> getDocumentInstanceSections() {
        return documentInstanceSections;
    }

    public void setDocumentInstanceSections(List<DocumentInstanceSection> documentInstanceSections) {
        this.documentInstanceSections = documentInstanceSections;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DocumentInstance that = (DocumentInstance) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(documentTemplateId, that.documentTemplateId) && Objects.equals(remoteUrl, that.remoteUrl) && Objects.equals(documentIsccCode, that.documentIsccCode) && Objects.equals(documentSha256Hash, that.documentSha256Hash) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(fileType, that.fileType) && Objects.equals(contentId, that.contentId) && Objects.equals(externalUrl, that.externalUrl) && Objects.equals(title, that.title) && Objects.equals(documentInstanceSections, that.documentInstanceSections);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, documentTemplateId, remoteUrl, documentIsccCode, documentSha256Hash, createdBy, updatedBy, createdAt, updatedAt, fileType, contentId, externalUrl, title, documentInstanceSections);
    }
}

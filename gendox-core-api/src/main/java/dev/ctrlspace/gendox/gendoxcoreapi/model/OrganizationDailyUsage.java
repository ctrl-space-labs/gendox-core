package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.util.Date;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "organization_daily_usage", schema = "gendox_core")
public class OrganizationDailyUsage {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Basic
    @Column(name = "date")
    private Date date;

    @Basic
    @Column(name = "messages", columnDefinition = "BIGINT DEFAULT 0")
    private Long messages;

    @Basic
    @Column(name = "active_users", columnDefinition = "BIGINT DEFAULT 0")
    private Long activeUsers;

    @Basic
    @Column(name = "document_uploads", columnDefinition = "BIGINT DEFAULT 0")
    private Long documentUploads;

    @Basic
    @Column(name = "document_sections", columnDefinition = "BIGINT DEFAULT 0")
    private Long documentSections;

    @Basic
    @Column(name = "storage_mb", columnDefinition = "BIGINT DEFAULT 0")
    private Long storageMb;

    @Basic
    @Column(name = "number_integrations", columnDefinition = "BIGINT DEFAULT 0")
    private Long numberIntegrations;


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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public Long getMessages() {
        return messages;
    }

    public void setMessages(Long messages) {
        this.messages = messages;
    }

    public Long getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(Long activeUsers) {
        this.activeUsers = activeUsers;
    }

    public Long getDocumentUploads() {
        return documentUploads;
    }

    public void setDocumentUploads(Long documentUploads) {
        this.documentUploads = documentUploads;
    }

    public Long getDocumentSections() {
        return documentSections;
    }

    public void setDocumentSections(Long documentSections) {
        this.documentSections = documentSections;
    }

    public Long getStorageMb() {
        return storageMb;
    }

    public void setStorageMb(Long storageMb) {
        this.storageMb = storageMb;
    }

    public Long getNumberIntegrations() {
        return numberIntegrations;
    }

    public void setNumberIntegrations(Long numberIntegrations) {
        this.numberIntegrations = numberIntegrations;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrganizationDailyUsage that = (OrganizationDailyUsage) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(date, that.date) && Objects.equals(messages, that.messages) && Objects.equals(activeUsers, that.activeUsers) && Objects.equals(documentUploads, that.documentUploads) && Objects.equals(documentSections, that.documentSections) && Objects.equals(storageMb, that.storageMb) && Objects.equals(numberIntegrations, that.numberIntegrations);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, date, messages, activeUsers, documentUploads, documentSections, storageMb, numberIntegrations);
    }
}


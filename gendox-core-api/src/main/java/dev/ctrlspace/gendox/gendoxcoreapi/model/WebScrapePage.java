package dev.ctrlspace.gendox.gendoxcoreapi.model;


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
@Table(name = "web_scrape_pages", schema = "gendox_core")
public class WebScrapePage {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "integration_id", nullable = false)
    private UUID integrationId;
    @Basic
    @Column(name = "url", nullable = false)
    private String url;
    @Basic
    @Column(name = "title", length = 1024)
    private String title;
    @Basic
    @Column(name = "is_selected", nullable = false)
    private Boolean isSelected = false;
    @Basic
    @Column(name = "status", nullable = false)
    private String status;
    @Basic
    @Column(name = "content_hash", length = 64)
    private String contentHash;
    @Basic
    @Column(name = "document_instance_id")
    private UUID documentInstanceId;
    @Basic
    @Column(name = "discovered_at")
    private Instant discoveredAt;
    @Basic
    @Column(name = "last_crawled_at")
    private Instant lastCrawledAt;
    @Basic
    @Column(name = "last_scraped_at")
    private Instant lastScrapedAt;
    @Basic
    @Column(name = "error_message")
    private String errorMessage;
    @Basic
    @Column(name = "created_at")
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at")
    @LastModifiedDate
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    @CreatedBy
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
    @LastModifiedBy
    private UUID updatedBy;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getIntegrationId() {
        return integrationId;
    }

    public void setIntegrationId(UUID integrationId) {
        this.integrationId = integrationId;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Boolean getSelected() {
        return isSelected;
    }

    public void setSelected(Boolean selected) {
        isSelected = selected;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getContentHash() {
        return contentHash;
    }

    public void setContentHash(String contentHash) {
        this.contentHash = contentHash;
    }

    public UUID getDocumentInstanceId() {
        return documentInstanceId;
    }

    public void setDocumentInstanceId(UUID documentInstanceId) {
        this.documentInstanceId = documentInstanceId;
    }

    public Instant getDiscoveredAt() {
        return discoveredAt;
    }

    public void setDiscoveredAt(Instant discoveredAt) {
        this.discoveredAt = discoveredAt;
    }

    public Instant getLastCrawledAt() {
        return lastCrawledAt;
    }

    public void setLastCrawledAt(Instant lastCrawledAt) {
        this.lastCrawledAt = lastCrawledAt;
    }

    public Instant getLastScrapedAt() {
        return lastScrapedAt;
    }

    public void setLastScrapedAt(Instant lastScrapedAt) {
        this.lastScrapedAt = lastScrapedAt;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
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
        if (o == null || getClass() != o.getClass()) return false;
        WebScrapePage that = (WebScrapePage) o;
        return Objects.equals(id, that.id) && Objects.equals(integrationId, that.integrationId) && Objects.equals(url, that.url) && Objects.equals(title, that.title) && Objects.equals(isSelected, that.isSelected) && Objects.equals(status, that.status) && Objects.equals(contentHash, that.contentHash) && Objects.equals(documentInstanceId, that.documentInstanceId) && Objects.equals(discoveredAt, that.discoveredAt) && Objects.equals(lastCrawledAt, that.lastCrawledAt) && Objects.equals(lastScrapedAt, that.lastScrapedAt) && Objects.equals(errorMessage, that.errorMessage) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, integrationId, url, title, isSelected, status, contentHash, documentInstanceId, discoveredAt, lastCrawledAt, lastScrapedAt, errorMessage, createdAt, updatedAt, createdBy, updatedBy);
    }
}

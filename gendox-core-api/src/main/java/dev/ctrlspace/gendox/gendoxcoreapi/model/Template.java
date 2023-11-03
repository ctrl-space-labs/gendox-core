package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "templates", schema = "gendox_core")
public class Template {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @Column(name = "name")
    private String name;

    @Basic
    @Column(name="text")
    private String text;

    @ManyToOne
    @JoinColumn(name="type",referencedColumnName = "id", nullable = false)
    private Type templateType;

    @Basic
    @Column(name = "organization_id")
    private UUID organizationId;

    @Basic
    @Column(name = "is_default", nullable = false)
    private Boolean isDefault;

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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Type getTemplateType() {
        return templateType;
    }

    public void setTemplateType(Type templateType) {
        this.templateType = templateType;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }

    public Boolean getDefault() {
        return isDefault;
    }

    public void setDefault(Boolean aDefault) {
        isDefault = aDefault;
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
        if (!(o instanceof Template template)) return false;
        return Objects.equals(getId(), template.getId()) && Objects.equals(getName(), template.getName()) && Objects.equals(getText(), template.getText()) && Objects.equals(getTemplateType(), template.getTemplateType()) && Objects.equals(getOrganizationId(), template.getOrganizationId()) && Objects.equals(isDefault, template.isDefault) && Objects.equals(getCreatedAt(), template.getCreatedAt()) && Objects.equals(getUpdatedAt(), template.getUpdatedAt()) && Objects.equals(getCreatedBy(), template.getCreatedBy()) && Objects.equals(getUpdatedBy(), template.getUpdatedBy());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getName(), getText(), getTemplateType(), getOrganizationId(), isDefault, getCreatedAt(), getUpdatedAt(), getCreatedBy(), getUpdatedBy());
    }
}

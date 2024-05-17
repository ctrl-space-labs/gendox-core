package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "ai_models", schema = "gendox_core")
public class AiModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "model", nullable = false, length = -1)
    private String model;
    @Basic
    @Column(name = "url", nullable = true, length = -1)
    private String url;
    @Basic
    @Column(name = "name", nullable = true, length = -1)
    private String name;
//    @Basic
//    @Column(name = "api_key", nullable = true, length = -1)
//    private String apiKey;
    @Basic
    @Column(name = "price", nullable = false, precision = 12)
    private BigDecimal price;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    @LastModifiedDate
    private Instant updatedAt;
    @Basic
    @Column(name = "description", nullable = false, length = -1)
    private String description;
    @ManyToOne
    @JoinColumn(name = "ai_model_type_id", referencedColumnName = "id", nullable = false)
    private Type aiModelType;


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

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }


    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }


    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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

    public Type getAiModelType() {
        return aiModelType;
    }

    public void setAiModelType(Type aiModelType) {
        this.aiModelType = aiModelType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AiModel aiModel)) return false;

        if (!Objects.equals(id, aiModel.id)) return false;
        if (!Objects.equals(model, aiModel.model)) return false;
        if (!Objects.equals(url, aiModel.url)) return false;
        if (!Objects.equals(name, aiModel.name)) return false;
        if (!Objects.equals(price, aiModel.price)) return false;
        if (!Objects.equals(createdAt, aiModel.createdAt)) return false;
        if (!Objects.equals(updatedAt, aiModel.updatedAt)) return false;
        if (!Objects.equals(description, aiModel.description)) return false;
        return Objects.equals(aiModelType, aiModel.aiModelType);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (model != null ? model.hashCode() : 0);
        result = 31 * result + (url != null ? url.hashCode() : 0);
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (price != null ? price.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        result = 31 * result + (aiModelType != null ? aiModelType.hashCode() : 0);
        return result;
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_models", schema = "gendox_core")
public class AiModel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "name", nullable = false, length = -1)
    private String name;
    @Basic
    @Column(name = "url", nullable = true, length = -1)
    private String url;
    @Basic
    @Column(name = "type", nullable = true, length = -1)
    private String type;
    @Basic
    @Column(name = "api_key", nullable = true, length = -1)
    private String apiKey;
    @Basic
    @Column(name = "price", nullable = false, precision = 12)
    private BigDecimal price;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        AiModel aiModel = (AiModel) o;

        if (id != null ? !id.equals(aiModel.id) : aiModel.id != null) return false;
        if (name != null ? !name.equals(aiModel.name) : aiModel.name != null) return false;
        if (url != null ? !url.equals(aiModel.url) : aiModel.url != null) return false;
        if (type != null ? !type.equals(aiModel.type) : aiModel.type != null) return false;
        if (apiKey != null ? !apiKey.equals(aiModel.apiKey) : aiModel.apiKey != null) return false;
        if (price != null ? !price.equals(aiModel.price) : aiModel.price != null) return false;
        if (createdAt != null ? !createdAt.equals(aiModel.createdAt) : aiModel.createdAt != null) return false;
        if (updatedAt != null ? !updatedAt.equals(aiModel.updatedAt) : aiModel.updatedAt != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (url != null ? url.hashCode() : 0);
        result = 31 * result + (type != null ? type.hashCode() : 0);
        result = 31 * result + (apiKey != null ? apiKey.hashCode() : 0);
        result = 31 * result + (price != null ? price.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        return result;
    }
}

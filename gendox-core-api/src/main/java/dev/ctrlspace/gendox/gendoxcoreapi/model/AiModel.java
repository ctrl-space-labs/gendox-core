package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
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
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;
    @Basic
    @Column(name = "description", nullable = false, length = -1)
    private String description;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AiModel aiModel = (AiModel) o;
        return Objects.equals(id, aiModel.id) && Objects.equals(model, aiModel.model) && Objects.equals(url, aiModel.url) && Objects.equals(name, aiModel.name) && Objects.equals(price, aiModel.price) && Objects.equals(createdAt, aiModel.createdAt) && Objects.equals(updatedAt, aiModel.updatedAt) && Objects.equals(description, aiModel.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, model, url, name, price, createdAt, updatedAt, description);
    }
}

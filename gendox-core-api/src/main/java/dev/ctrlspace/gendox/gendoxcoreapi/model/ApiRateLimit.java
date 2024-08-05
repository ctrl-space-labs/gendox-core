package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "api_rate_limits", schema = "gendox_core")
public class ApiRateLimit {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "tier_type_id", referencedColumnName = "id", nullable = false)
    private Type tierType;
    @Basic
    @Column(name = "public_completions_per_minute", nullable = false)
    private Integer publicCompletionsPerMinute;
    @Basic
    @Column(name = "completions_per_minute", nullable = false, length = 255)
    private Integer completionsPerMinute;
    @Basic
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Type getTierType() {
        return tierType;
    }

    public void setTierType(Type tierType) {
        this.tierType = tierType;
    }

    public Integer getPublicCompletionsPerMinute() {
        return publicCompletionsPerMinute;
    }

    public void setPublicCompletionsPerMinute(Integer publicCompletionsPerMinute) {
        this.publicCompletionsPerMinute = publicCompletionsPerMinute;
    }

    public Integer getCompletionsPerMinute() {
        return completionsPerMinute;
    }

    public void setCompletionsPerMinute(Integer completionsPerMinute) {
        this.completionsPerMinute = completionsPerMinute;
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
        ApiRateLimit that = (ApiRateLimit) o;
        return Objects.equals(id, that.id) && Objects.equals(tierType, that.tierType) && Objects.equals(publicCompletionsPerMinute, that.publicCompletionsPerMinute) && Objects.equals(completionsPerMinute, that.completionsPerMinute) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tierType, publicCompletionsPerMinute, completionsPerMinute, createdAt, updatedAt);
    }
}

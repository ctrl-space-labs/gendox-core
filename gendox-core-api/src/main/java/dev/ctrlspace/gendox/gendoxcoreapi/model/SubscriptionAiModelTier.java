package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "subscription_ai_model_tier", schema = "gendox_core")
public class SubscriptionAiModelTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "subscription_plan_id", referencedColumnName = "id", nullable = false)
    private SubscriptionPlan subscriptionPlan;

    @ManyToOne
    @JoinColumn(name = "ai_model_tier_id", referencedColumnName = "id", nullable = false)
    private Type aiModelTier;

    @Basic
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Basic
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;


    public UUID getId() {return id;}

    public void setId(UUID id) {this.id = id;}

    public SubscriptionPlan getSubscriptionPlan() {return subscriptionPlan;}

    public void setSubscriptionPlan(SubscriptionPlan subscriptionPlan) {this.subscriptionPlan = subscriptionPlan;}

    public Type getAiModelTier() {return aiModelTier;}

    public void setAiModelTier(Type aiModelTier) {this.aiModelTier = aiModelTier;}

    public Instant getCreatedAt() {return createdAt;}

    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}

    public Instant getUpdatedAt() {return updatedAt;}

    public void setUpdatedAt(Instant updatedAt) {this.updatedAt = updatedAt;}

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SubscriptionAiModelTier that = (SubscriptionAiModelTier) o;
        return Objects.equals(id, that.id) && Objects.equals(subscriptionPlan, that.subscriptionPlan) && Objects.equals(aiModelTier, that.aiModelTier) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, subscriptionPlan, aiModelTier, createdAt, updatedAt);
    }
}

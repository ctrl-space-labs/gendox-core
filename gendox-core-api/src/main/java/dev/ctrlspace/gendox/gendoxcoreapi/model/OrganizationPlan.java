package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "organization_plan", schema = "gendox_core")
public class OrganizationPlan {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @ManyToOne
    @JoinColumn(name = "organization_id", referencedColumnName = "id", nullable = false)
    private Organization organization;

    @ManyToOne
    @JoinColumn(name = "subscription_plan_id", referencedColumnName = "id", nullable = false)
    private SubscriptionPlan subscriptionPlan;

    @ManyToOne
    @JoinColumn(name = "api_rate_limit_id", referencedColumnName = "id", nullable = false)
    private ApiRateLimit apiRateLimit;

    @Basic
    @Column(name = "start_date", nullable = false)
    private Instant startDate;
    @Basic
    @Column(name = "end_date", nullable = true)
    private Instant endDate;
    @Basic
    @Column(name = "number_of_seats", nullable = false)
    private Integer numberOfSeats;
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

    public Organization getOrganization() {
        return organization;
    }

    public void setOrganization(Organization organization) {
        this.organization = organization;
    }

    public SubscriptionPlan getSubscriptionPlan() {
        return subscriptionPlan;
    }

    public void setSubscriptionPlan(SubscriptionPlan subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    public ApiRateLimit getApiRateLimit() {
        return apiRateLimit;
    }

    public void setApiRateLimit(ApiRateLimit apiRateLimit) {
        this.apiRateLimit = apiRateLimit;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public void setStartDate(Instant startDate) {
        this.startDate = startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public void setEndDate(Instant endDate) {
        this.endDate = endDate;
    }

    public Integer getNumberOfSeats() {
        return numberOfSeats;
    }

    public void setNumberOfSeats(Integer numberOfSeats) {
        this.numberOfSeats = numberOfSeats;
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
        OrganizationPlan that = (OrganizationPlan) o;
        return Objects.equals(id, that.id) && Objects.equals(organization, that.organization) && Objects.equals(subscriptionPlan, that.subscriptionPlan) && Objects.equals(apiRateLimit, that.apiRateLimit) && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate) && Objects.equals(numberOfSeats, that.numberOfSeats) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organization, subscriptionPlan, apiRateLimit, startDate, endDate, numberOfSeats, createdAt, updatedAt);
    }
}

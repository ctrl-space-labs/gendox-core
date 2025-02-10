package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans", schema = "gendox_core")
public class SubscriptionPlan {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "sku", nullable = false, length = 255)
    private String sku;

    @ManyToOne
    @JoinColumn(name = "sku_type_id", referencedColumnName = "id", nullable = false)
    private Type skuType;

    @ManyToOne
    @JoinColumn(name = "api_rate_limit_id", referencedColumnName = "id", nullable = false)
    private ApiRateLimit apiRateLimit;

    @Basic
    @Column(name = "name", nullable = false, length = 255)
    private String name;
    @Basic
    @Column(name = "description", nullable = true, length = -1)
    private String description;
    @Basic
    @Column(name = "price", nullable = false, precision = 2)
    private BigDecimal price;
    @Basic
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;
    @Basic
    @Column(name = "moq", nullable = false)
    private Integer moq;
    @Basic
    @Column(name = "user_upload_limit_file_count", nullable = false)
    private Integer userUploadLimitFileCount;
    @Basic
    @Column(name = "user_upload_limit_mb", nullable = false)
    private Integer userUploadLimitMb;
    @Basic
    @Column(name = "user_message_monthly_limit_count", nullable = false)
    private Integer userMessageMonthlyLimitCount;

    @Basic
    @Column(name = "active", nullable = false)
    private Boolean active;

    @Basic
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Basic
    @Column(name = "organization_web_sites")
    private Integer organizationWebSites;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Type getSkuType() {
        return skuType;
    }

    public void setSkuType(Type skuType) {
        this.skuType = skuType;
    }

    public ApiRateLimit getApiRateLimit() {
        return apiRateLimit;
    }

    public void setApiRateLimit(ApiRateLimit apiRateLimit) {
        this.apiRateLimit = apiRateLimit;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getMoq() {
        return moq;
    }

    public void setMoq(Integer moq) {
        this.moq = moq;
    }

    public Integer getUserUploadLimitFileCount() {
        return userUploadLimitFileCount;
    }

    public void setUserUploadLimitFileCount(Integer userUploadLimitFileCount) {
        this.userUploadLimitFileCount = userUploadLimitFileCount;
    }

    public Integer getUserUploadLimitMb() {
        return userUploadLimitMb;
    }

    public void setUserUploadLimitMb(Integer userUploadLimitMb) {
        this.userUploadLimitMb = userUploadLimitMb;
    }

    public Integer getUserMessageMonthlyLimitCount() {
        return userMessageMonthlyLimitCount;
    }

    public void setUserMessageMonthlyLimitCount(Integer userMessageMonthlyLimitCount) {
        this.userMessageMonthlyLimitCount = userMessageMonthlyLimitCount;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
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

    public Integer getOrganizationWebSites() {
        return organizationWebSites;
    }

    public void setOrganizationWebSites(Integer organizationWebSites) {
        this.organizationWebSites = organizationWebSites;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SubscriptionPlan that = (SubscriptionPlan) o;
        return Objects.equals(id, that.id) && Objects.equals(sku, that.sku) && Objects.equals(skuType, that.skuType) && Objects.equals(apiRateLimit, that.apiRateLimit) && Objects.equals(name, that.name) && Objects.equals(description, that.description) && Objects.equals(price, that.price) && Objects.equals(currency, that.currency) && Objects.equals(moq, that.moq) && Objects.equals(userUploadLimitFileCount, that.userUploadLimitFileCount) && Objects.equals(userUploadLimitMb, that.userUploadLimitMb) && Objects.equals(userMessageMonthlyLimitCount, that.userMessageMonthlyLimitCount) && Objects.equals(active, that.active) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(organizationWebSites, that.organizationWebSites);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, sku, skuType, apiRateLimit, name, description, price, currency, moq, userUploadLimitFileCount, userUploadLimitMb, userMessageMonthlyLimitCount, active, createdAt, updatedAt, organizationWebSites);
    }
}

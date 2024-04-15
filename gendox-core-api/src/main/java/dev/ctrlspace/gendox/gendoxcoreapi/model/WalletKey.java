package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "wallet_keys", schema = "gendox_core")
public class WalletKey {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Basic
    @Column(name = "private_key", nullable = false, length = -1)
    private String privateKey;


    @ManyToOne
    @JoinColumn(name = "key_type_id", referencedColumnName = "id", nullable = false)
    private Type keyTypeId;

    @Basic
    @Column(name = "created_at")
    private Instant createdAt;

    @Basic
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Basic
    @Column(name = "created_by")
    private UUID createdBy;

    @Basic
    @Column(name = "updated_by")
    private UUID updatedBy;


    public UUID getId() {return id;}

    public void setId(UUID id) {this.id = id;}

    public UUID getOrganizationId() {return organizationId;}

    public void setOrganizationId(UUID organizationId) {this.organizationId = organizationId;}

    public String getPrivateKey() {return privateKey;}

    public void setPrivateKey(String privateKey) {this.privateKey = privateKey;}

    public Type getKeyTypeId() {return keyTypeId;}

    public void setKeyTypeId(Type keyTypeId) {this.keyTypeId = keyTypeId;}

    public Instant getCreatedAt() {return createdAt;}

    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}

    public Instant getUpdatedAt() {return updatedAt;}

    public void setUpdatedAt(Instant updatedAt) {this.updatedAt = updatedAt;}

    public UUID getCreatedBy() {return createdBy;}

    public void setCreatedBy(UUID createdBy) {this.createdBy = createdBy;}

    public UUID getUpdatedBy() {return updatedBy;}

    public void setUpdatedBy(UUID updatedBy) {this.updatedBy = updatedBy;}


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WalletKey walletKey = (WalletKey) o;
        return Objects.equals(id, walletKey.id) && Objects.equals(organizationId, walletKey.organizationId) && Objects.equals(privateKey, walletKey.privateKey) && Objects.equals(keyTypeId, walletKey.keyTypeId) && Objects.equals(createdAt, walletKey.createdAt) && Objects.equals(updatedAt, walletKey.updatedAt) && Objects.equals(createdBy, walletKey.createdBy) && Objects.equals(updatedBy, walletKey.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, privateKey, keyTypeId, createdAt, updatedAt, createdBy, updatedBy);
    }
}
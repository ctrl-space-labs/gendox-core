package dev.ctrlspace.gendox.gendoxcoreapi.model;

import id.walt.crypto.keys.LocalKey;
import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

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
    @Column(name = "local_key", nullable = false)
    private LocalKey localKey;

    @Basic
    @Column(name = "jwk_key_format", nullable = false)
    private String jwkKeyFormat;
    @Basic
    @Column(name = "character_length", nullable = false)
    private Integer characterLength;
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

    public LocalKey getLocalKey() {return localKey;}

    public void setLocalKey(LocalKey localKey) {this.localKey = localKey;}

    public String getJwkKeyFormat() {return jwkKeyFormat;}

    public void setJwkKeyFormat(String jwkKeyFormat) {this.jwkKeyFormat = jwkKeyFormat;}
    public Type getKeyTypeId() {return keyTypeId;}

    public void setKeyTypeId(Type keyTypeId) {this.keyTypeId = keyTypeId;}

    public Integer getCharacterLength() {return characterLength;}

    public void setCharacterLength(Integer characterLength) {this.characterLength = characterLength;}

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
        return Objects.equals(id, walletKey.id) && Objects.equals(organizationId, walletKey.organizationId) && Objects.equals(localKey, walletKey.localKey) && Objects.equals(jwkKeyFormat, walletKey.jwkKeyFormat) && Objects.equals(characterLength, walletKey.characterLength) && Objects.equals(keyTypeId, walletKey.keyTypeId) && Objects.equals(createdAt, walletKey.createdAt) && Objects.equals(updatedAt, walletKey.updatedAt) && Objects.equals(createdBy, walletKey.createdBy) && Objects.equals(updatedBy, walletKey.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, localKey, jwkKeyFormat, characterLength, keyTypeId, createdAt, updatedAt, createdBy, updatedBy);
    }
}
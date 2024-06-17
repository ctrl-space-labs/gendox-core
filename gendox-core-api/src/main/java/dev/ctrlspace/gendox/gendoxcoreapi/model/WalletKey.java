package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.google.gson.Gson;
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
    @Column(name = "public_key", nullable = false)
    private String publicKey;

    @JsonIgnore
//    @org.hibernate.annotations.Type(LocalKeyUserType.class)
    @Column(name = "jwk_key_format")
    private String jwkKeyFormat;
    @Basic
    @Column(name = "character_length")
    private Integer characterLength;
    @ManyToOne
    @JoinColumn(name = "key_type_id", referencedColumnName = "id")
    private Type keyType;

    @Basic
    @Column(name = "created_at", nullable = true)
    private Instant createdAt;

    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;

    @Basic
    @Column(name = "created_by", nullable = true)
    private UUID createdBy;

    @Basic
    @Column(name = "updated_by", nullable = true)
    private UUID updatedBy;


    public UUID getId() {return id;}

    public void setId(UUID id) {this.id = id;}

    public UUID getOrganizationId() {return organizationId;}

    public void setOrganizationId(UUID organizationId) {this.organizationId = organizationId;}

    public String getPublicKey() {return publicKey;}

    public void setPublicKey(String publicKey) {this.publicKey = publicKey;}

    public String getJwkKeyFormat() {return jwkKeyFormat;}

    public void setJwkKeyFormat(String jwkKeyFormat) {this.jwkKeyFormat = jwkKeyFormat;}

    public Type getKeyType() {return keyType;}

    public void setKeyType(Type keyType) {this.keyType = keyType;}

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
        return Objects.equals(id, walletKey.id) && Objects.equals(organizationId, walletKey.organizationId) && Objects.equals(publicKey, walletKey.publicKey) && Objects.equals(jwkKeyFormat, walletKey.jwkKeyFormat) && Objects.equals(characterLength, walletKey.characterLength) && Objects.equals(keyType, walletKey.keyType) && Objects.equals(createdAt, walletKey.createdAt) && Objects.equals(updatedAt, walletKey.updatedAt) && Objects.equals(createdBy, walletKey.createdBy) && Objects.equals(updatedBy, walletKey.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, publicKey, jwkKeyFormat, characterLength, keyType, createdAt, updatedAt, createdBy, updatedBy);
    }
}
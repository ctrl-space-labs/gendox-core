package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * This class represents the WalletKey object that will be returned from the /organizations/{orgId}/wallet-key API.
 * This will contain only the public part of the key.
 */

@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
public class WalletKeyDTO {

    // Set of fields that can be public for different key types
    private static final Set<String> PUBLIC_FIELDS_OKP = Set.of("kty", "crv", "x", "kid", "n", "e", "y");


    private UUID id;
    private UUID organizationId;
    private Type keyType;
    private Integer characterLength;
    private Instant createdAt;
    private Instant updatedAt;
    private String publicKey;
    private UUID createdBy;
    private UUID updatedBy;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }





    public Type getKeyType() {
        return keyType;
    }

    public void setKeyType(Type keyType) {
        this.keyType = keyType;
    }

    public Integer getCharacterLength() {
        return characterLength;
    }

    public void setCharacterLength(Integer characterLength) {
        this.characterLength = characterLength;
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


    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {this.publicKey = publicKey;}
    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WalletKeyDTO that = (WalletKeyDTO) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(keyType, that.keyType) && Objects.equals(characterLength, that.characterLength) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(publicKey, that.publicKey) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, keyType, characterLength, createdAt, updatedAt, publicKey, createdBy, updatedBy);
    }
}

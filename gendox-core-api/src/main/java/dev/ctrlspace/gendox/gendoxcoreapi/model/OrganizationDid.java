package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "organization_dids", schema = "gendox_core")
public class OrganizationDid {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Basic
    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;


    @JsonManagedReference(value = "organization")
    @ManyToOne
    @JoinColumn(name = "organization_id", referencedColumnName = "id", nullable = false)
    private Organization organization;
    @Basic
    @Column(name = "key_id", nullable = false)
    private UUID keyId;

    @Basic
    @Column(name = "did", nullable = false, length = -1)
    private String did;

    @Basic
    @Column(name = "created_at")
    private Instant createdAt;

    @Basic
    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getId() {return id;}

    public void setId(UUID id) {this.id = id;}

    public UUID getOrganizationId() {return organizationId;}

    public void setOrganizationId(UUID organizationId) {this.organizationId = organizationId;}

    public Organization getOrganization() {return organization;}

    public void setOrganization(Organization organization) {this.organization = organization;}

    public UUID getKeyId() {return keyId;}

    public void setKeyId(UUID keyId) {this.keyId = keyId;}

    public String getDid() {return did;}

    public void setDid(String did) {this.did = did;}

    public Instant getCreatedAt() {return createdAt;}

    public void setCreatedAt(Instant createdAt) {this.createdAt = createdAt;}

    public Instant getUpdatedAt() {return updatedAt;}

    public void setUpdatedAt(Instant updatedAt) {this.updatedAt = updatedAt;}


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrganizationDid that = (OrganizationDid) o;
        return Objects.equals(id, that.id) && Objects.equals(organizationId, that.organizationId) && Objects.equals(organization, that.organization) && Objects.equals(keyId, that.keyId) && Objects.equals(did, that.did) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, organizationId, organization, keyId, did, createdAt, updatedAt);
    }
}

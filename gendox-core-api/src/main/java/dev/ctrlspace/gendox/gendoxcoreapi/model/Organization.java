package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "organizations", schema = "gendox_core")
public class Organization {

    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "name", nullable = false)
    private String name;
    @Basic
    @Column(name = "display_name", nullable = true)
    private String displayName;
    @Basic
    @Column(name = "address", nullable = true)
    private String address;
    @Basic
    @Column(name = "phone", nullable = true)
    private String phone;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    @LastModifiedDate
    private Instant updatedAt;

    @Basic
    @Column(name = "developer_email", nullable = true)
    private String developerEmail;
    @Basic
    @Column(name = "is_active", nullable = true)
    private Boolean isActive;


    @JsonBackReference(value = "organizationUser")
    @OneToMany(mappedBy = "organization", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<UserOrganization> userOrganizations;

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

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public List<UserOrganization> getUserOrganizations() {
        return userOrganizations;
    }

    public void setUserOrganizations(List<UserOrganization> userOrganizations) {
        this.userOrganizations = userOrganizations;
    }

    public String getDeveloperEmail() {
        return developerEmail;
    }

    public void setDeveloperEmail(String developerEmail) {
        this.developerEmail = developerEmail;
    }

    public Boolean getActive() {return isActive;}

    public void setActive(Boolean active) {isActive = active;}

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Organization that = (Organization) o;
        return Objects.equals(id, that.id) && Objects.equals(name, that.name) && Objects.equals(displayName, that.displayName) && Objects.equals(address, that.address) && Objects.equals(phone, that.phone) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(developerEmail, that.developerEmail) && Objects.equals(isActive, that.isActive) && Objects.equals(userOrganizations, that.userOrganizations);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name, displayName, address, phone, createdAt, updatedAt, developerEmail, isActive, userOrganizations);
    }
}

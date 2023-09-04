package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "gendox_core")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;
    @Basic
    @Column(name = "name", nullable = true)
    private String name;
    @Basic
    @Column(name = "email", nullable = false)
    private String email;
    @Basic
    @Column(name = "phone", nullable = true, length = 20)
    private String phone;
    @ManyToOne
    @JoinColumn(name = "global_role_id", referencedColumnName = "id", nullable = false)
    private Type globalRole;
    @Basic
    @Column(name = "created_at", nullable = true)
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;


    @JsonBackReference(value = "userOrg")
    @OneToMany(mappedBy = "user")
    private List<UserOrganization> userOrganizations;

    @JsonBackReference(value = "user")
    @OneToMany(mappedBy = "user")
    private List<ProjectMember> projectMembers = new ArrayList<>();

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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Type getGlobalRole() {
        return globalRole;
    }

    public void setGlobalRole(Type globalRole) {
        this.globalRole = globalRole;
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

    public List<ProjectMember> getProjectMembers() {
        return projectMembers;
    }

    public void setProjectMembers(List<ProjectMember> projectMembers) {
        this.projectMembers = projectMembers;
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        User user = (User) o;

        if (!Objects.equals(id, user.id)) return false;
        if (!Objects.equals(name, user.name)) return false;
        if (!Objects.equals(email, user.email)) return false;
        if (!Objects.equals(phone, user.phone)) return false;
        if (!Objects.equals(globalRole, user.globalRole)) return false;
        if (!Objects.equals(createdAt, user.createdAt)) return false;
        if (!Objects.equals(updatedAt, user.updatedAt)) return false;
        if (!Objects.equals(userOrganizations, user.userOrganizations))
            return false;
        return Objects.equals(projectMembers, user.projectMembers);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (email != null ? email.hashCode() : 0);
        result = 31 * result + (phone != null ? phone.hashCode() : 0);
        result = 31 * result + (globalRole != null ? globalRole.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        result = 31 * result + (userOrganizations != null ? userOrganizations.hashCode() : 0);
        result = 31 * result + (projectMembers != null ? projectMembers.hashCode() : 0);
        return result;
    }
}

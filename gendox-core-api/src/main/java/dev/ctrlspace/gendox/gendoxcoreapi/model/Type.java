package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;

@Entity
@Table(name = "types", schema = "gendox_core")
public class Type {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    @Column(name = "id", nullable = false)
    private Long id;
    @Basic
    @Column(name = "type_category", nullable = false, length = -1)
    private String typeCategory;
    @Basic
    @Column(name = "name", nullable = false, length = -1)
    private String name;
    @Basic
    @Column(name = "description", nullable = false, length = -1)
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTypeCategory() {
        return typeCategory;
    }

    public void setTypeCategory(String typeCategory) {
        this.typeCategory = typeCategory;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        Type type = (Type) o;

        if (id != null ? !id.equals(type.id) : type.id != null) return false;
        if (typeCategory != null ? !typeCategory.equals(type.typeCategory) : type.typeCategory != null) return false;
        if (name != null ? !name.equals(type.name) : type.name != null) return false;
        if (description != null ? !description.equals(type.description) : type.description != null) return false;

        return true;
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (typeCategory != null ? typeCategory.hashCode() : 0);
        result = 31 * result + (name != null ? name.hashCode() : 0);
        result = 31 * result + (description != null ? description.hashCode() : 0);
        return result;
    }
}

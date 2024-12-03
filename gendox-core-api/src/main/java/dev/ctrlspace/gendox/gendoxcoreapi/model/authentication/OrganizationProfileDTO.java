package dev.ctrlspace.gendox.gendoxcoreapi.model.authentication;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@SqlResultSetMapping(
        name = "OrganizationProfileDTO",
        classes = @ConstructorResult(
                targetClass = OrganizationProfileDTO.class,
                columns = {
                        @ColumnResult(name = "id", type = String.class),
                        @ColumnResult(name = "phone", type = String.class),
                        @ColumnResult(name = "user_type_name", type = String.class),
                        @ColumnResult(name = "user_type_id", type = Long.class),
                        @ColumnResult(name = "name", type = String.class),
                        @ColumnResult(name = "role_id", type = Long.class),
                        @ColumnResult(name = "role_name", type = String.class)
                }
        )
)
@NamedNativeQuery(
        name = "OrganizationProfileDTO.findOrganizationProfileById",
        query = """
        SELECT
            o.id as id,
            o.phone as phone,
            :roleType as user_type_name, -- Use roleType dynamically
            t.id as user_type_id,
            o.name as name
        FROM gendox_core.organizations o
        LEFT JOIN gendox_core.types t ON o.user_type_id = t.id
        LEFT JOIN gendox_core.organization_roles r ON o.id = r.organization_id
        WHERE o.id = :orgId
        """,
        resultSetMapping = "OrganizationProfileMapping"
)
@Entity
public class OrganizationProfileDTO {
    @Id
    private String id;
    private String phone;
    private String userTypeName;
    private Long userTypeId;
    private String name;
    private Long roleId;
    private String roleName;
}

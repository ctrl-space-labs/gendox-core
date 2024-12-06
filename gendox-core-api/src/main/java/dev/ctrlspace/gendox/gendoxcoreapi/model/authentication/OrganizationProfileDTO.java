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
        name = "OrganizationProfileMapping",
        classes = @ConstructorResult(
                targetClass = OrganizationProfileDTO.class,
                columns = {
                        @ColumnResult(name = "id", type = String.class),
                        @ColumnResult(name = "phone", type = String.class),
                        @ColumnResult(name = "user_type_name", type = String.class),
                        @ColumnResult(name = "name", type = String.class)
                }
        )
)
@NamedNativeQuery(
        name = "OrganizationProfileDTO.findOrganizationProfileById",
        query = """
        SELECT
            o.id as id,
            o.phone as phone,
            'ROLE_ADMIN' as user_type_name,
            o.name as name
        FROM gendox_core.organizations o
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
    private String name;
}

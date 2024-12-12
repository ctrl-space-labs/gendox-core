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
        name = "OrganizationProfileProjectAgentMapping",
        classes = @ConstructorResult(
                targetClass = OrganizationProfileProjectAgentDTO.class,
                columns = {
                        @ColumnResult(name = "id", type = String.class),
                        @ColumnResult(name = "user_type_id", type = Long.class),
                        @ColumnResult(name = "user_type_name", type = String.class),
                        @ColumnResult(name = "org_id", type = String.class),
                        @ColumnResult(name = "org_name", type = String.class),
                        @ColumnResult(name = "display_name", type = String.class),
                        @ColumnResult(name = "org_phone", type = String.class),
                        @ColumnResult(name = "address", type = String.class),
                        @ColumnResult(name = "org_role_id", type = Long.class),
                        @ColumnResult(name = "org_role_name", type = String.class),
                        @ColumnResult(name = "project_id", type = String.class),
                        @ColumnResult(name = "project_name", type = String.class),
                        @ColumnResult(name = "project_description", type = String.class),
                        @ColumnResult(name = "project_created_at", type = Instant.class),
                        @ColumnResult(name = "project_updated_at", type = Instant.class),
                        @ColumnResult(name = "agent_user_id", type = String.class),
                        @ColumnResult(name = "agent_id", type = String.class),
                        @ColumnResult(name = "agent_name", type = String.class),
                        @ColumnResult(name = "agent_created_at", type = Instant.class),
                        @ColumnResult(name = "agent_updated_at", type = Instant.class),
                        @ColumnResult(name = "org_created_at", type = Instant.class),
                        @ColumnResult(name = "org_updated_at", type = Instant.class)
                }
        )
)
@NamedNativeQuery(
        name = "OrganizationProfileDTO.findOrganizationProfileById",
        query = """
        SELECT
            ak.id as id,
            (SELECT t.id FROM gendox_core.types t WHERE t.name = 'GENDOX_API_KEY') as user_type_id,
            'GENDOX_API_KEY' as user_type_name,
            o.id as org_id,
            o.name as org_name,
            o.display_name as display_name,
            o.phone as org_phone,
            o.address as address,
            (SELECT t.id FROM gendox_core.types t WHERE t.name = 'ROLE_ADMIN') as org_role_id,
            'ROLE_ADMIN' as org_role_name,
            p.id as project_id,
            p.name as project_name,
            p.description as project_description,
            p.created_at as project_created_at,
            p.updated_at as project_updated_at,
            u.id as agent_user_id,
            pa.id as agent_id,
            pa.agent_name as agent_name,
            pa.created_at as agent_created_at,
            pa.updated_at as agent_updated_at,
            o.created_at as org_created_at,
            o.updated_at as org_updated_at
        FROM gendox_core.organizations o
        LEFT JOIN gendox_core.projects p ON p.organization_id = o.id
        LEFT JOIN gendox_core.project_agent pa ON p.id = pa.project_id
        LEFT join gendox_core.users u ON u.id = pa.user_id
        INNER JOIN gendox_core.api_keys ak ON ak.organization_id = o.id
        WHERE o.id = :orgId and 
            ak.api_key = :apiKeyStr and 
            p.name != 'DEACTIVATED'
        """,
        resultSetMapping = "OrganizationProfileProjectAgentMapping"
)
@Entity
public class OrganizationProfileProjectAgentDTO {

    @Id
    private String id;
    private Long userTypeId;
    private String userTypeName;
    private String orgId;
    private String orgName;
    private String displayName;
    private String orgPhone;
    private String address;
    private Long orgRoleId;
    private String orgRoleName;
    private String projectId;
    private String projectName;
    private String projectDescription;
    private Instant projectCreatedAt;
    private Instant projectUpdatedAt;
    private String agentUserId;
    private String agentId;
    private String agentName;
    private Instant agentCreatedAt;
    private Instant agentUpdatedAt;
    private Instant orgCreatedAt;
    private Instant orgUpdatedAt;
}




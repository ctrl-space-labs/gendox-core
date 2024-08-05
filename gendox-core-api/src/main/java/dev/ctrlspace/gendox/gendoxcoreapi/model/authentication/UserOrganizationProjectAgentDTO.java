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
        name = "UserOrganizationProjectAgentMapping",
        classes = @ConstructorResult(
                targetClass = UserOrganizationProjectAgentDTO.class,
                columns = {
                        @ColumnResult(name = "id", type = String.class),
                        @ColumnResult(name = "email", type = String.class),
                        @ColumnResult(name = "first_name", type = String.class),
                        @ColumnResult(name = "last_name", type = String.class),
                        @ColumnResult(name = "user_name", type = String.class),
                        @ColumnResult(name = "phone", type = String.class),
                        @ColumnResult(name = "users_type_id", type = Integer.class),
                        @ColumnResult(name = "name", type = String.class),
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
                        @ColumnResult(name = "agent_id", type = String.class),
                        @ColumnResult(name = "agent_user_id", type = String.class),
                        @ColumnResult(name = "agent_name", type = String.class),
                        @ColumnResult(name = "agent_created_at", type = Instant.class),
                        @ColumnResult(name = "agent_updated_at", type = Instant.class),
                        @ColumnResult(name = "org_created_at", type = Instant.class),
                        @ColumnResult(name = "org_updated_at", type = Instant.class)
                }
        )
)
@NamedNativeQuery(
        name = "UserOrganizationProjectAgent.findRawUserProfileById",
        query = """
        SELECT distinct u.id,
               u.email,
               u.first_name,
               u.last_name,
               u.user_name,
               u.phone,
               u.users_type_id,
               u.name,
               o.id as org_id,
               o.name as org_name,
               o.display_name,
               o.phone as org_phone,
               o.address,
               rt.id as org_role_id,
               rt.name as org_role_name,
               p.id as project_id,
               p.name as project_name,
               p.description as project_description,
               p.created_at as project_created_at,
               p.updated_at as project_updated_at,
               pa.id as agent_id,
               au.id as agent_user_id,
               pa.agent_name,
               pa.created_at as agent_created_at,
               pa.updated_at as agent_updated_at,
               o.created_at as org_created_at,
               o.updated_at as org_updated_at
        FROM gendox_core.users u
            inner join gendox_core.user_organization uo on u.id = uo.user_id
            inner join gendox_core.types rt on rt.id = uo.organization_role_id
            inner join gendox_core.organizations o ON uo.organization_id = o.id
            inner join gendox_core.project_members pm on u.id = pm.user_id
            left join gendox_core.projects p ON pm.project_id = p.id and p.organization_id = o.id
            left join gendox_core.project_agent pa ON p.id = pa.project_id
            left join gendox_core.users au ON au.id = pa.user_id
        WHERE u.id = :userId
    """,
        resultSetMapping = "UserOrganizationProjectAgentMapping"
)
@Entity
public class UserOrganizationProjectAgentDTO {
    @Id //this is a dummy id, just to make JPA happy!
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String userName;
    private String phone;
    private Integer usersTypeId;
    private String name;
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
    private String agentId;
    private String agentUserId;
    private String agentName;
    private Instant agentCreatedAt;
    private Instant agentUpdatedAt;
    private Instant orgCreatedAt;
    private Instant orgUpdatedAt;
}
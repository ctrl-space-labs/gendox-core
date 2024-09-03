package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;



@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@Entity
@SqlResultSetMapping(
        name = "MessageMetadataDTOMapping",
        classes = {
                @ConstructorResult(
                        targetClass = MessageMetadataDTO.class,
                        columns = {
                                @ColumnResult(name = "sectionid", type = UUID.class),
                                @ColumnResult(name = "messageid", type = UUID.class),
                                @ColumnResult(name = "sectionurl", type = String.class),
                                @ColumnResult(name = "username", type = String.class),
                                @ColumnResult(name = "organizationname", type = String.class),
                                @ColumnResult(name = "iscccode", type = String.class),
                                @ColumnResult(name = "createdat", type = Instant.class),
                                @ColumnResult(name = "threadid", type = UUID.class),
                                @ColumnResult(name = "documentid", type = UUID.class),  // Ensure this matches the query
                                @ColumnResult(name = "documenturl", type = String.class),  // Ensure this matches the query
                                @ColumnResult(name = "policytypename", type = String.class),
                                @ColumnResult(name = "policyvalue", type = String.class)
                        }
                )
        }
)
@NamedNativeQuery(
        name = "MessageMetadataDTO.getMessageMetadataByMessageId",
        query = """
            SELECT
                ms.section_id AS sectionid,
                m.id AS messageid,
                ms.section_url AS sectionurl,
                u.name AS username,
                o.name AS organizationname,
                dis.section_iscc_code AS iscccode,
                m.created_at AS createdat,
                m.thread_id AS threadid,
                d.id AS documentid,  -- Ensure this alias matches the @ColumnResult name
                d.remote_url AS documenturl,  -- Ensure this alias matches the @ColumnResult name
                pt.name AS policytypename,
                acp.value AS policyvalue  -- Directly retrieves the policy value
            FROM
                gendox_core.message m
            INNER JOIN
                gendox_core.message_section ms ON m.id = ms.message_id
            INNER JOIN
                gendox_core.document_instance_sections dis ON ms.section_id = dis.id
            INNER JOIN
                gendox_core.document_instance d ON dis.document_instance_id = d.id  -- Join to include document details
            INNER JOIN
                gendox_core.users u ON d.created_by = u.id
            INNER JOIN
                gendox_core.organizations o ON d.organization_id = o.id
            INNER JOIN
                gendox_core.project_documents pd ON d.id = pd.document_id
            LEFT JOIN
                proven_ai.acl_policies acp ON acp.data_pod_id = pd.project_id
            INNER JOIN
                proven_ai.policy_types pt ON acp.policy_type_id = pt.id
                AND pt.name = 'ATTRIBUTION_POLICY'
            WHERE
                m.id = :messageId
            """,
        resultSetMapping = "MessageMetadataDTOMapping"
)

public class MessageMetadataDTO {
    @Id
    private UUID sectionId;
    private UUID messageId;
    private String sectionUrl;
    private String userName;
    private String organizationName;
    private String isccCode;
    private Instant createdAt;
    private UUID threadId;
    private UUID documentId;  // Ensure this matches the query alias
    private String documentUrl;  // Ensure this matches the query alias
    private String policyTypeName;
    private String policyValue;
}

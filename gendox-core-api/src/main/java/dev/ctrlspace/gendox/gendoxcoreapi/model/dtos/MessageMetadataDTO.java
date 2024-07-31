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
                pt.name AS policytypename,
                COALESCE(acp.value, 'OWNER_NAME, ORIGINAL DOCUMENT') AS policyvalue
            FROM
                gendox_core.message m
            INNER JOIN
                gendox_core.message_section ms ON m.id = ms.message_id
            INNER JOIN
                gendox_core.document_instance_sections dis ON ms.section_id = dis.id
            INNER JOIN
                gendox_core.document_instance d ON ms.document_id = d.id
            INNER JOIN
                gendox_core.users u ON d.created_by = u.id
            INNER JOIN
                gendox_core.organizations o ON d.organization_id = o.id
            INNER JOIN
                gendox_core.project_documents pd ON d.id = pd.document_id
            LEFT JOIN
                proven_ai.acl_policies acp ON acp.data_pod_id = pd.project_id
            LEFT JOIN
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
    private String policyTypeName;
    private String policyValue;
}
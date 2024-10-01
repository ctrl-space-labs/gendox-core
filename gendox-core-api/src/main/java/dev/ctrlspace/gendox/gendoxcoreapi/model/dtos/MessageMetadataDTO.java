package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
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
                                @ColumnResult(name = "documentid", type = UUID.class),
                                @ColumnResult(name = "documenturl", type = String.class),
                                @ColumnResult(name = "sectiontitle", type = String.class),
                                @ColumnResult(name = "policytypename", type = String.class),
                                @ColumnResult(name = "policyvalue", type = String[].class)
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
                    d.id AS documentid,
                    d.remote_url AS documenturl,
                    dsm.title AS sectiontitle,
                    pt.name AS policytypename,
                     COALESCE(ARRAY_AGG(acp.value) FILTER (WHERE acp.value IS NOT NULL),
                        CASE
                            WHEN pd.project_id = ct.project_id THEN ARRAY['ORIGINAL_DOCUMENT']\s
                            ELSE NULL
                        END
               ) AS policyvalue
                FROM
                    gendox_core.message m
                        INNER JOIN
                    gendox_core.message_section ms ON m.id = ms.message_id
                        INNER JOIN
                    gendox_core.document_instance_sections dis ON ms.section_id = dis.id
                        INNER JOIN
                    gendox_core.document_instance d ON dis.document_instance_id = d.id
                        INNER JOIN
                    gendox_core.document_section_metadata dsm ON dis.document_section_metadata_id = dsm.id
                        INNER JOIN
                    gendox_core.users u ON d.created_by = u.id
                        INNER JOIN
                    gendox_core.organizations o ON d.organization_id = o.id
                        INNER JOIN
                    gendox_core.project_documents pd ON d.id = pd.document_id
                        INNER JOIN
                    gendox_core.chat_thread ct ON m.thread_id = ct.id
                        LEFT JOIN
                    proven_ai.acl_policies acp ON acp.data_pod_id = pd.project_id
                        LEFT JOIN
                    proven_ai.policy_types pt ON acp.policy_type_id = pt.id
                WHERE
                    m.id = :messageId
                    AND (pt.name = 'ATTRIBUTION_POLICY' OR pt.name IS NULL)
                GROUP BY
                    ms.section_id, m.id, ms.section_url, u.name, o.name, dis.section_iscc_code, m.created_at, m.thread_id, d.id, d.remote_url, dsm.title, pt.name, pd.project_id, ct.project_id
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
    private UUID documentId;
    private String documentUrl;
    private String sectionTitle;
    private String policyTypeName;
    private List<String> policyValue;

    public MessageMetadataDTO(UUID sectionId, UUID messageId, String sectionUrl, String userName, String organizationName,
                              String isccCode, Instant createdAt, UUID threadId, UUID documentId, String documentUrl,
                              String sectionTitle, String policyTypeName, String[] policyValueArray) {
        this.sectionId = sectionId;
        this.messageId = messageId;
        this.sectionUrl = sectionUrl;
        this.userName = userName;
        this.organizationName = organizationName;
        this.isccCode = isccCode;
        this.createdAt = createdAt;
        this.threadId = threadId;
        this.documentId = documentId;
        this.documentUrl = documentUrl;
        this.sectionTitle = sectionTitle;
        this.policyTypeName = policyTypeName;
        this.policyValue = Arrays.asList(policyValueArray);
    }
}

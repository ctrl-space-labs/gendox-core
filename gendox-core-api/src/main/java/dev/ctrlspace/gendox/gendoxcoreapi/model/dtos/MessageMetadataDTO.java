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
                                @ColumnResult(name = "iscompletionparticipant", type = Boolean.class),
                                @ColumnResult(name = "externalUrl", type = String.class),
                                @ColumnResult(name = "username", type = String.class),
                                @ColumnResult(name = "organizationname", type = String.class),
                                @ColumnResult(name = "organizationid", type = UUID.class),
                                @ColumnResult(name = "iscccode", type = String.class),
                                @ColumnResult(name = "sectionvalue", type = String.class),
                                @ColumnResult(name = "createdat", type = Instant.class),
                                @ColumnResult(name = "threadid", type = UUID.class),
                                @ColumnResult(name = "documentid", type = UUID.class),
                                @ColumnResult(name = "documenturl", type = String.class),
                                @ColumnResult(name = "documenttitle", type = String.class),
                                @ColumnResult(name = "sectiontitle", type = String.class),
                                @ColumnResult(name = "policytypename", type = String.class),
                                @ColumnResult(name = "policyvalue")
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
                        ms.is_completion_participant AS iscompletionparticipant,
                        d.external_url AS externalUrl,
                        u.name AS username,
                        o.name AS organizationname,
                        o.id AS organizationid,
                        dis.section_iscc_code AS iscccode,
                        dis.section_value AS sectionvalue,
                        m.created_at AS createdat,
                        m.thread_id AS threadid,
                        d.id AS documentid,
                        d.remote_url AS documenturl,
                        d.title AS documenttitle,
                        dsm.title AS sectiontitle,
                        pt.name AS policytypename,
                         COALESCE(ARRAY_AGG(acp.value) FILTER (WHERE acp.value IS NOT NULL),
                            CASE
                                WHEN pd.project_id = ct.project_id THEN ARRAY['ORIGINAL_DOCUMENT']
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
                            LEFT JOIN
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
                        ms.section_id, m.id, ms.section_url, ms.is_completion_participant, u.name, o.name, o.id, dis.section_iscc_code, dis.section_value, m.created_at, m.thread_id, d.id, d.remote_url, d.title, dsm.title, pt.name, pd.project_id, ct.project_id
                """,
        resultSetMapping = "MessageMetadataDTOMapping"
)


public class MessageMetadataDTO {
    @Id
    private UUID sectionId;
    private UUID messageId;
    private String sectionUrl;
    private Boolean isCompletionParticipant;
    private String externalUrl;
    private String userName;
    private String organizationName;
    private UUID organizationId;
    private String isccCode;
    private String sectionValue;
    private Instant createdAt;
    private UUID threadId;
    private UUID documentId;
    private String documentUrl;
    private String documentTitle;
    private String sectionTitle;
    private String policyTypeName;
    private List<String> policyValue;

    public MessageMetadataDTO(UUID sectionId, UUID messageId, String sectionUrl, Boolean isCompletionParticipant, String externalUrl, String userName, String organizationName,
                              UUID organizationId, String isccCode, String sectionValue, Instant createdAt, UUID threadId, UUID documentId,
                              String documentUrl, String documentTitle, String sectionTitle, String policyTypeName, String[] policyValueArray) {
        this.sectionId = sectionId;
        this.messageId = messageId;
        this.sectionUrl = sectionUrl;
        this.isCompletionParticipant = isCompletionParticipant;
        this.externalUrl = externalUrl;
        this.userName = userName;
        this.organizationName = organizationName;
        this.organizationId = organizationId;
        this.isccCode = isccCode;
        this.sectionValue = sectionValue;
        this.createdAt = createdAt;
        this.threadId = threadId;
        this.documentId = documentId;
        this.documentUrl = documentUrl;
        this.documentTitle = documentTitle;
        this.sectionTitle = sectionTitle;
        this.policyTypeName = policyTypeName;
        this.policyValue = Arrays.asList(policyValueArray);
    }
}

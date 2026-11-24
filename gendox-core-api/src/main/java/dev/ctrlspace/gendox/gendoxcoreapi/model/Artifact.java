package dev.ctrlspace.gendox.gendoxcoreapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "artifacts", schema = "gendox_core")
public class Artifact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "thread_id", nullable = false)
    private UUID threadId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Category ARTIFACT_TYPE: HTML, SVG, MARKDOWN, CODE.
     */
    @ManyToOne
    @JoinColumn(name = "artifact_type_id", referencedColumnName = "id", nullable = false)
    private Type artifactType;

    /**
     * For type CODE only.
     */
    @Column(name = "code_language")
    private String codeLanguage;

    /**
     * How it shows in the answer, category ARTIFACT_DISPLAY: CARD or INLINE; null is a card, as every artifact made
     * before it showed.
     */
    @ManyToOne
    @JoinColumn(name = "display_id", referencedColumnName = "id")
    private Type display;

    /**
     * The number of the latest version; raised only by ArtifactService, with the version it adds.
     */
    @Column(name = "latest_version", nullable = false)
    private Integer latestVersion;

    /**
     * The one person who made it: only they share it, make it public and delete it.
     */
    @Column(name = "owner_id")
    private UUID ownerId;

    /**
     * General access, category ARTIFACT_ROLE: the role every member of the agent has (VIEW, INTERACT, EDIT);
     * null for only the owner and the people invited.
     */
    @ManyToOne
    @JoinColumn(name = "general_access_role_id", referencedColumnName = "id")
    private Type generalAccessRole;

    /**
     * The id in its public link, view only for anyone, with its shared data; null while it is not public. A new one each time.
     */
    @Column(name = "public_id")
    private UUID publicId;

    @Column(name = "public_at")
    private Instant publicAt;

    @Column(name = "public_by")
    private UUID publicBy;


    @CreatedDate
    @Column(name = "created_at")
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @CreatedBy
    @Column(name = "created_by")
    private UUID createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private UUID updatedBy;
}
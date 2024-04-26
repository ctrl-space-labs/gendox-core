package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "project_agent", schema = "gendox_core")
public class ProjectAgent {
    @GeneratedValue(strategy = GenerationType.UUID)
    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @JsonBackReference(value = "agent")
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "project_id", referencedColumnName = "id", nullable = false)
    private Project project;
    @Basic
    @Column(name = "user_id", nullable = true)
    private UUID userId;

    @ManyToOne
    @JoinColumn(name = "semantic_search_model_id", referencedColumnName = "id", nullable = true)
    private AiModel semanticSearchModel;

    @ManyToOne
    @JoinColumn(name = "completion_model_id", referencedColumnName = "id", nullable = true)
    private AiModel completionModel;
    @Basic
    @Column(name = "agent_name", nullable = false, length = -1)
    private String agentName;
    @Basic
    @Column(name = "agent_behavior", nullable = true, length = -1)
    private String agentBehavior;
    @Basic
    @Column(name = "private_agent", nullable = true)
    private Boolean privateAgent;
    @Basic
    @Column(name = "created_at", nullable = true)
    @CreatedDate
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    @LastModifiedDate
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    @CreatedBy
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
    @LastModifiedBy
    private UUID updatedBy;
    @ManyToOne
    @JoinColumn(name = "document_splitter_type", referencedColumnName = "id", nullable = false)
    private Type documentSplitterType;

    @Basic
    @Column(name = "chat_template_id", nullable = true)
    private UUID chatTemplateId;

    @Basic
    @Column(name = "section_template_id", nullable = true)
    private UUID sectionTemplateId;

    @Basic
    @Column(name = "max_token", nullable = true)
    private Long maxToken;
    @Basic
    @Column(name = "temperature", nullable = true)
    private Double temperature;

    @Basic
    @Column(name = "top_p", nullable = true)
    private Double topP;

    @Basic
    @Column(name = "moderation_check" , nullable = true)
    private Boolean moderationCheck;

    @ManyToOne
    @JoinColumn(name = "moderation_model_id", referencedColumnName = "id", nullable = true)
    private AiModel moderationModel;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }


    public AiModel getSemanticSearchModel() {
        return semanticSearchModel;
    }

    public void setSemanticSearchModel(AiModel semanticSearchModel) {
        this.semanticSearchModel = semanticSearchModel;
    }

    public AiModel getCompletionModel() {
        return completionModel;
    }

    public void setCompletionModel(AiModel completionModel) {
        this.completionModel = completionModel;
    }

    public String getAgentName() {
        return agentName;
    }

    public void setAgentName(String agentName) {
        this.agentName = agentName;
    }

    public String getAgentBehavior() {
        return agentBehavior;
    }

    public void setAgentBehavior(String agentBehavior) {
        this.agentBehavior = agentBehavior;
    }

    public Boolean getPrivateAgent() {
        return privateAgent;
    }

    public void setPrivateAgent(Boolean privateAgent) {
        this.privateAgent = privateAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }

    public UUID getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(UUID updatedBy) {
        this.updatedBy = updatedBy;
    }

    public Type getDocumentSplitterType() {
        return documentSplitterType;
    }

    public void setDocumentSplitterType(Type documentSplitterType) {
        this.documentSplitterType = documentSplitterType;
    }

    public UUID getChatTemplateId() {
        return chatTemplateId;
    }

    public void setChatTemplateId(UUID chatTemplateId) {
        this.chatTemplateId = chatTemplateId;
    }

    public UUID getSectionTemplateId() {
        return sectionTemplateId;
    }

    public void setSectionTemplateId(UUID sectionTemplateId) {
        this.sectionTemplateId = sectionTemplateId;
    }

    public UUID getUserId() {
        return userId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Long getMaxToken() {
        return maxToken;
    }

    public void setMaxToken(Long maxToken) {
        this.maxToken = maxToken;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getTopP() {
        return topP;
    }

    public void setTopP(Double topP) {
        this.topP = topP;
    }

    public Boolean getModerationCheck() {
        return moderationCheck;
    }

    public void setModerationCheck(Boolean moderationCheck) {
        this.moderationCheck = moderationCheck;
    }

    public AiModel getModerationModel() {
        return moderationModel;
    }

    public void setModerationModel(AiModel moderationModel) {
        this.moderationModel = moderationModel;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectAgent that)) return false;

        if (!Objects.equals(id, that.id)) return false;
        if (!Objects.equals(project, that.project)) return false;
        if (!Objects.equals(userId, that.userId)) return false;
        if (!Objects.equals(semanticSearchModel, that.semanticSearchModel))
            return false;
        if (!Objects.equals(completionModel, that.completionModel))
            return false;
        if (!Objects.equals(agentName, that.agentName)) return false;
        if (!Objects.equals(agentBehavior, that.agentBehavior))
            return false;
        if (!Objects.equals(privateAgent, that.privateAgent)) return false;
        if (!Objects.equals(createdAt, that.createdAt)) return false;
        if (!Objects.equals(updatedAt, that.updatedAt)) return false;
        if (!Objects.equals(createdBy, that.createdBy)) return false;
        if (!Objects.equals(updatedBy, that.updatedBy)) return false;
        if (!Objects.equals(documentSplitterType, that.documentSplitterType))
            return false;
        if (!Objects.equals(chatTemplateId, that.chatTemplateId))
            return false;
        if (!Objects.equals(sectionTemplateId, that.sectionTemplateId))
            return false;
        if (!Objects.equals(maxToken, that.maxToken)) return false;
        if (!Objects.equals(temperature, that.temperature)) return false;
        if (!Objects.equals(topP, that.topP)) return false;
        if (!Objects.equals(moderationCheck, that.moderationCheck))
            return false;
        return Objects.equals(moderationModel, that.moderationModel);
    }

    @Override
    public int hashCode() {
        int result = id != null ? id.hashCode() : 0;
        result = 31 * result + (project != null ? project.hashCode() : 0);
        result = 31 * result + (userId != null ? userId.hashCode() : 0);
        result = 31 * result + (semanticSearchModel != null ? semanticSearchModel.hashCode() : 0);
        result = 31 * result + (completionModel != null ? completionModel.hashCode() : 0);
        result = 31 * result + (agentName != null ? agentName.hashCode() : 0);
        result = 31 * result + (agentBehavior != null ? agentBehavior.hashCode() : 0);
        result = 31 * result + (privateAgent != null ? privateAgent.hashCode() : 0);
        result = 31 * result + (createdAt != null ? createdAt.hashCode() : 0);
        result = 31 * result + (updatedAt != null ? updatedAt.hashCode() : 0);
        result = 31 * result + (createdBy != null ? createdBy.hashCode() : 0);
        result = 31 * result + (updatedBy != null ? updatedBy.hashCode() : 0);
        result = 31 * result + (documentSplitterType != null ? documentSplitterType.hashCode() : 0);
        result = 31 * result + (chatTemplateId != null ? chatTemplateId.hashCode() : 0);
        result = 31 * result + (sectionTemplateId != null ? sectionTemplateId.hashCode() : 0);
        result = 31 * result + (maxToken != null ? maxToken.hashCode() : 0);
        result = 31 * result + (temperature != null ? temperature.hashCode() : 0);
        result = 31 * result + (topP != null ? topP.hashCode() : 0);
        result = 31 * result + (moderationCheck != null ? moderationCheck.hashCode() : 0);
        result = 31 * result + (moderationModel != null ? moderationModel.hashCode() : 0);
        return result;
    }
}
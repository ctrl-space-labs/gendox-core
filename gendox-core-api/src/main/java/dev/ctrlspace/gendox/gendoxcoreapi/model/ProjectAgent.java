package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    @Basic
    @Column(name = "agent_vc_jwt", nullable = true)
    private String agentVcJwt;

    @Basic
    @Column(name = "organization_did", nullable = true)
    private String organizationDid;

    @Basic
    @Column(name = "max_search_limit")
    private Long maxSearchLimit;

    @Basic
    @Column(name = "max_completion_limit")
    private Long maxCompletionLimit;

    @Basic
    @Column(name= "rerank_enable")
    private Boolean rerankEnable;

    @ManyToOne
    @JoinColumn(name= "rerank_model_id", referencedColumnName = "id", nullable = true)
    private AiModel rerankModel;

    @Basic
    @Column(name= "advanced_search_enable")
    private Boolean advancedSearchEnable;

    @ManyToOne
    @JoinColumn(name= "advanced_search_model_id", referencedColumnName = "id", nullable = true)
    private AiModel advancedSearchModel;

    @JsonManagedReference(value = "aiTools")
    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AiTools> aiTools = new ArrayList<>();

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

    public String getAgentVcJwt() {return agentVcJwt;}

    public void setAgentVcJwt(String agentVcJwt) {this.agentVcJwt = agentVcJwt;}

    public String getOrganizationDid() {return organizationDid;}

    public void setOrganizationDid(String organizationDid) {this.organizationDid = organizationDid;}


    public Long getMaxSearchLimit() {
        return maxSearchLimit;
    }

    public void setMaxSearchLimit(Long maxSearchLimit) {
        this.maxSearchLimit = maxSearchLimit;
    }

    public Long getMaxCompletionLimit() {
        return maxCompletionLimit;
    }

    public void setMaxCompletionLimit(Long maxCompletionLimit) {
        this.maxCompletionLimit = maxCompletionLimit;
    }

    public Boolean getRerankEnable() {
        return rerankEnable;
    }

    public void setRerankEnable(Boolean rerankEnable) {
        this.rerankEnable = rerankEnable;
    }

    public AiModel getRerankModel() {
        return rerankModel;
    }

    public void setRerankModel(AiModel rerankModel) {
        this.rerankModel = rerankModel;
    }

    public List<AiTools> getAiTools() {
        return aiTools;
    }

    public void setAiTools(List<AiTools> aiTools) {
        this.aiTools = aiTools;
    }

    public Boolean getAdvancedSearchEnable() {
        return advancedSearchEnable;
    }

    public void setAdvancedSearchEnable(Boolean advancedSearchEnable) {
        this.advancedSearchEnable = advancedSearchEnable;
    }

    public AiModel getAdvancedSearchModel() {
        return advancedSearchModel;
    }

    public void setAdvancedSearchModel(AiModel advancedSearchModel) {
        this.advancedSearchModel = advancedSearchModel;
    }


    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        ProjectAgent agent = (ProjectAgent) o;
        return Objects.equals(id, agent.id) && Objects.equals(project, agent.project) && Objects.equals(userId, agent.userId) && Objects.equals(semanticSearchModel, agent.semanticSearchModel) && Objects.equals(completionModel, agent.completionModel) && Objects.equals(agentName, agent.agentName) && Objects.equals(agentBehavior, agent.agentBehavior) && Objects.equals(privateAgent, agent.privateAgent) && Objects.equals(createdAt, agent.createdAt) && Objects.equals(updatedAt, agent.updatedAt) && Objects.equals(createdBy, agent.createdBy) && Objects.equals(updatedBy, agent.updatedBy) && Objects.equals(documentSplitterType, agent.documentSplitterType) && Objects.equals(chatTemplateId, agent.chatTemplateId) && Objects.equals(sectionTemplateId, agent.sectionTemplateId) && Objects.equals(maxToken, agent.maxToken) && Objects.equals(temperature, agent.temperature) && Objects.equals(topP, agent.topP) && Objects.equals(moderationCheck, agent.moderationCheck) && Objects.equals(moderationModel, agent.moderationModel) && Objects.equals(agentVcJwt, agent.agentVcJwt) && Objects.equals(organizationDid, agent.organizationDid) && Objects.equals(maxSearchLimit, agent.maxSearchLimit) && Objects.equals(maxCompletionLimit, agent.maxCompletionLimit) && Objects.equals(rerankEnable, agent.rerankEnable) && Objects.equals(rerankModel, agent.rerankModel) && Objects.equals(advancedSearchEnable, agent.advancedSearchEnable) && Objects.equals(advancedSearchModel, agent.advancedSearchModel) && Objects.equals(aiTools, agent.aiTools);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, project, userId, semanticSearchModel, completionModel, agentName, agentBehavior, privateAgent, createdAt, updatedAt, createdBy, updatedBy, documentSplitterType, chatTemplateId, sectionTemplateId, maxToken, temperature, topP, moderationCheck, moderationModel, agentVcJwt, organizationDid, maxSearchLimit, maxCompletionLimit, rerankEnable, rerankModel, advancedSearchEnable, advancedSearchModel, aiTools);
    }
}
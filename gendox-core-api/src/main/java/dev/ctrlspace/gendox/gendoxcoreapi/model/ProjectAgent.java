package dev.ctrlspace.gendox.gendoxcoreapi.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
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
    private Instant createdAt;
    @Basic
    @Column(name = "updated_at", nullable = true)
    private Instant updatedAt;
    @Basic
    @Column(name = "created_by")
    private UUID createdBy;
    @Basic
    @Column(name = "updated_by")
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


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ProjectAgent that = (ProjectAgent) o;
        return Objects.equals(id, that.id) && Objects.equals(project, that.project) && Objects.equals(userId, that.userId) && Objects.equals(semanticSearchModel, that.semanticSearchModel) && Objects.equals(completionModel, that.completionModel) && Objects.equals(agentName, that.agentName) && Objects.equals(agentBehavior, that.agentBehavior) && Objects.equals(privateAgent, that.privateAgent) && Objects.equals(createdAt, that.createdAt) && Objects.equals(updatedAt, that.updatedAt) && Objects.equals(createdBy, that.createdBy) && Objects.equals(updatedBy, that.updatedBy) && Objects.equals(documentSplitterType, that.documentSplitterType) && Objects.equals(chatTemplateId, that.chatTemplateId) && Objects.equals(sectionTemplateId, that.sectionTemplateId) && Objects.equals(maxToken, that.maxToken) && Objects.equals(temperature, that.temperature) && Objects.equals(topP, that.topP);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, project, userId, semanticSearchModel, completionModel, agentName, agentBehavior, privateAgent, createdAt, updatedAt, createdBy, updatedBy, documentSplitterType, chatTemplateId, sectionTemplateId, maxToken, temperature, topP);
    }
}
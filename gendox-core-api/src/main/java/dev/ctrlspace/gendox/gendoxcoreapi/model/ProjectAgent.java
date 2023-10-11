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
    @OneToOne
    @JoinColumn(name = "project_id", referencedColumnName = "id", nullable = false)
    private Project project;

    @Basic
    @Column(name = "semantic_search_model_id", nullable = true)
    private UUID semanticSearchModelId;
    @Basic
    @Column(name = "completion_model_id", nullable = true)
    private UUID completionModelId;
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
    @ManyToOne
    @JoinColumn(name = "document_splitter_type", referencedColumnName = "id", nullable = false)
    private Type documentSplitterType;
    @ManyToOne
    @JoinColumn(name = "chat_template_type", referencedColumnName = "id", nullable = false)
    private Type chatTemplateType;
    @ManyToOne
    @JoinColumn(name = "section_template_type", referencedColumnName = "id", nullable = false)
    private Type sectionTemplateType;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public UUID getSemanticSearchModelId() {
        return semanticSearchModelId;
    }

    public void setSemanticSearchModelId(UUID semanticSearchModelId) {
        this.semanticSearchModelId = semanticSearchModelId;
    }

    public UUID getCompletionModelId() {
        return completionModelId;
    }

    public void setCompletionModelId(UUID completionModelId) {
        this.completionModelId = completionModelId;
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

    public Type getDocumentSplitterType() {
        return documentSplitterType;
    }

    public void setDocumentSplitterType(Type documentSplitterType) {
        this.documentSplitterType = documentSplitterType;
    }

    public Type getChatTemplateType() {
        return chatTemplateType;
    }

    public void setChatTemplateType(Type chatTemplateType) {
        this.chatTemplateType = chatTemplateType;
    }

    public Type getSectionTemplateType() {
        return sectionTemplateType;
    }

    public void setSectionTemplateType(Type sectionTemplateType) {
        this.sectionTemplateType = sectionTemplateType;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProjectAgent that)) return false;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getProject(), that.getProject()) && Objects.equals(getSemanticSearchModelId(), that.getSemanticSearchModelId()) && Objects.equals(getCompletionModelId(), that.getCompletionModelId()) && Objects.equals(getAgentName(), that.getAgentName()) && Objects.equals(getAgentBehavior(), that.getAgentBehavior()) && Objects.equals(getPrivateAgent(), that.getPrivateAgent()) && Objects.equals(getCreatedAt(), that.getCreatedAt()) && Objects.equals(getUpdatedAt(), that.getUpdatedAt()) && Objects.equals(getDocumentSplitterType(), that.getDocumentSplitterType()) && Objects.equals(getChatTemplateType(), that.getChatTemplateType()) && Objects.equals(getSectionTemplateType(), that.getSectionTemplateType());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getProject(), getSemanticSearchModelId(), getCompletionModelId(), getAgentName(), getAgentBehavior(), getPrivateAgent(), getCreatedAt(), getUpdatedAt(), getDocumentSplitterType(), getChatTemplateType(), getSectionTemplateType());
    }
}

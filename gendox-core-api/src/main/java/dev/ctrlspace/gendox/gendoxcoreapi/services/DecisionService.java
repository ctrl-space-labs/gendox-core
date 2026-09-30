package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionUsage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.DecisionModelApiAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
public class DecisionService {
    private static final Logger logger = LoggerFactory.getLogger(DecisionService.class);

    private final AiModelUtils aiModelUtils;
    private final OrganizationModelKeyService modelKeyService;
    private final AuditLogsService auditLogsService;
    private final TypeService typeService;

    public DecisionService(AiModelUtils aiModelUtils,
                           OrganizationModelKeyService modelKeyService,
                           AuditLogsService auditLogsService,
                           TypeService typeService) {
        this.aiModelUtils = aiModelUtils;
        this.modelKeyService = modelKeyService;
        this.auditLogsService = auditLogsService;
        this.typeService = typeService;
    }

    /** Shared entry point for document insights and a future LLM decision tool. */
    public DecisionResponse evaluate(ProjectAgent agent, DecisionRequest request) throws GendoxException {
        AiModel model = agent.getDecisionModel();
        if (model == null) {
            throw new GendoxException("DECISION_MODEL_NOT_CONFIGURED", "No decision model is configured for this agent", HttpStatus.BAD_REQUEST);
        }
        OrganizationModelProviderKey organizationKey = modelKeyService.getKeyForAgent(agent, "DECISION_MODEL");
        String apiKey = organizationKey != null
                ? organizationKey.getKey()
                : modelKeyService.getDefaultKeyForAgent(agent, "DECISION_MODEL");

        Type requestAuditType = typeService.getAuditLogTypeByName("DECISION_REQUEST");
        Type responseAuditType = typeService.getAuditLogTypeByName("DECISION_RESPONSE");
        DecisionModelApiAdapter adapter = aiModelUtils.getDecisionModelApiAdapterImpl(model.getApiType().getName());

        long startedAt = System.nanoTime();
        DecisionResponse response = adapter.evaluate(request, model, apiKey);
        long durationMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startedAt);
        DecisionUsage usage = response.getUsage();
        Long inputTokens = usage != null ? usage.getInputTokens() : null;
        Long outputTokens = usage != null ? usage.getOutputTokens() : null;
        Long totalTokens = inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;

        saveDecisionAuditLogs(agent.getProject(), usage, requestAuditType, responseAuditType);
        logger.debug("Received decision reply from {} using {}. Input tokens: {}, Output tokens: {}, Total: {}, Questions: {}, Duration: {} ms",
                model.getUrl(), response.getModel(), inputTokens, outputTokens,
                totalTokens, request.getQuestions().size(), durationMs);

        return response;
    }

    private void saveDecisionAuditLogs(Project project,
                                       DecisionUsage usage,
                                       Type requestAuditType,
                                       Type responseAuditType) {
        if (usage == null) {
            logger.warn("Decision model response did not include token usage; no token audit logs were created");
            return;
        }

        saveDecisionAuditLog(project, requestAuditType, usage.getInputTokens(), "input");
        saveDecisionAuditLog(project, responseAuditType, usage.getOutputTokens(), "output");
    }

    private void saveDecisionAuditLog(Project project, Type auditType, Long tokenCount, String tokenType) {
        if (tokenCount == null) {
            logger.warn("Decision model response did not include {} token usage; that token audit log was not created", tokenType);
            return;
        }

        AuditLogs auditLog = auditLogsService.createDefaultAuditLogs(auditType);
        auditLog.setTokenCount(tokenCount);
        auditLog.setProjectId(project.getId());
        auditLog.setOrganizationId(project.getOrganizationId());
        auditLogsService.saveAuditLogs(auditLog);
    }
}

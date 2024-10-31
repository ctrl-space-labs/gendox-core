package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModelProvider;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AuditLogsCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelProviderRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AuditLogsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AuditLogsPredicates;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.micrometer.tracing.Tracer;

import java.util.List;
import java.util.UUID;

@Service
public class AiModelService {

    private AiModelRepository aiModelRepository;

    private AiModelProviderRepository aiModelProviderRepository;

    private AuditLogsRepository auditLogsRepository;

    private SecurityUtils securityUtils;

    private Tracer tracer;



    @Autowired
    public AiModelService(AiModelRepository aiModelRepository,
                          AiModelProviderRepository aiModelProviderRepository,
                          AuditLogsRepository auditLogsRepository,
                          SecurityUtils securityUtils,
                          Tracer tracer) {
        this.aiModelRepository = aiModelRepository;
        this.aiModelProviderRepository = aiModelProviderRepository;
        this.auditLogsRepository = auditLogsRepository;
        this.securityUtils = securityUtils;
        this.tracer = tracer;

    }



    public List<AiModel> getAllActiveAiModelsByOrganizationId(UUID organizationId) {
        return aiModelRepository.findAllActiveModelsByOrganizationId(organizationId);
    }


    public AiModel getByName(String modelName) throws GendoxException {
        return aiModelRepository
                .findByName(modelName)
                .orElseThrow(() -> new GendoxException("AI_MODEL_NOT_FOUND", "AI Model not found with name: " + modelName, HttpStatus.NOT_FOUND));
    }


    public AiModelProvider getProviderByName(String providerName) throws GendoxException {
        return aiModelProviderRepository
                .findByName(providerName)
                .orElseThrow(() -> new GendoxException("AI_MODEL_PROVIDER_NOT_FOUND", "AI Model Provider not found with name: " + providerName, HttpStatus.NOT_FOUND));
    }

    public Long getTokens(AuditLogsCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return auditLogsRepository.findAll(AuditLogsPredicates.build(criteria), pageable).stream()
                .mapToLong(AuditLogs::getTokenCount)
                .sum();
    }

    public AuditLogs createAuditLogs(UUID projectId, Long tokenCount, Type auditType) {
        AuditLogs auditLog = new AuditLogs();
        auditLog.setUserId(securityUtils.getUserId());
        auditLog.setProjectId(projectId);
        auditLog.setTokenCount(tokenCount);
        auditLog.setType(auditType);

        auditLog.setSpanId(tracer.currentSpan().context().spanId());
        auditLog.setTraceId(tracer.currentSpan().context().traceId());

        auditLog = auditLogsRepository.save(auditLog);

        return auditLog;
    }


}

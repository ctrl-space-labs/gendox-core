package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AuditLogsCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AuditLogsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AuditLogsPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.micrometer.tracing.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AuditLogsService {

    private AuditLogsRepository auditLogsRepository;
    private SecurityUtils securityUtils;
    private Tracer tracer;
    private TypeService typeService;

    private static final Logger logger = LoggerFactory.getLogger(AuditLogsService.class);

    @Autowired
    public AuditLogsService(AuditLogsRepository auditLogsRepository,
                            SecurityUtils securityUtils,
                            Tracer tracer,
                            TypeService typeService) {
        this.auditLogsRepository = auditLogsRepository;
        this.securityUtils = securityUtils;
        this.tracer = tracer;
        this.typeService = typeService;
    }


    public Long getTokens(AuditLogsCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return auditLogsRepository.findAll(AuditLogsPredicates.build(criteria), pageable).stream()
                .mapToLong(AuditLogs::getTokenCount)
                .sum();
    }

    public AuditLogs createDefaultAuditLogs(Type auditType) {
        AuditLogs auditLog = new AuditLogs();
        logger.trace("Creating audit log entry.");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        auditLog.setUserId(securityUtils.getUserId());
        logger.trace("Set user ID: {}", securityUtils.getUserId());
        auditLog.setType(auditType);
        logger.trace("Set audit type: {}", auditType);
        if (tracer.currentSpan() != null) {
            auditLog.setTraceId(tracer.currentSpan().context().traceId());
            logger.trace("Set audit type: {}", auditType);
            auditLog.setSpanId(tracer.currentSpan().context().spanId());
            logger.trace("Set trace ID: {}", tracer.currentSpan().context().traceId());
        }
        return auditLog;
    }

    public void createAuditLog(UUID organizationId, UUID projectId, String logType, Long auditValue) throws GendoxException {
        Type auditLogType = typeService.getAuditLogTypeByName(logType);
        AuditLogs auditLogs = this.createDefaultAuditLogs(auditLogType);
        auditLogs.setOrganizationId(organizationId);
        auditLogs.setProjectId(projectId);
        auditLogs.setAuditValue(auditValue);
        this.saveAuditLogs(auditLogs);
    }

    public AuditLogs saveAuditLogs(AuditLogs auditLogs) {
        return auditLogsRepository.save(auditLogs);
    }

}

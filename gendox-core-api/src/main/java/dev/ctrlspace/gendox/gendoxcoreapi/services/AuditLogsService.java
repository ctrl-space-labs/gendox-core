package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AuditLogsCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AuditLogsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.specifications.AuditLogsPredicates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import io.micrometer.tracing.Tracer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AuditLogsService {

    private AuditLogsRepository auditLogsRepository;
    private SecurityUtils securityUtils;
    private Tracer tracer;

    @Autowired
    public AuditLogsService(AuditLogsRepository auditLogsRepository,
                            SecurityUtils securityUtils,
                            Tracer tracer) {
        this.auditLogsRepository = auditLogsRepository;
        this.securityUtils = securityUtils;
        this.tracer = tracer;
    }


    public Long getTokens(AuditLogsCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            throw new GendoxException("Pageable cannot be null", "pageable.null", HttpStatus.BAD_REQUEST);
        }
        return auditLogsRepository.findAll(AuditLogsPredicates.build(criteria), pageable).stream()
                .mapToLong(AuditLogs::getTokenCount)
                .sum();
    }

    public AuditLogs createAuditLogs(Type auditType) {
        AuditLogs auditLog = new AuditLogs();
        auditLog.setUserId(securityUtils.getUserId());
        auditLog.setType(auditType);

        auditLog.setSpanId(tracer.currentSpan().context().spanId());
        auditLog.setTraceId(tracer.currentSpan().context().traceId());

        auditLog = auditLogsRepository.save(auditLog);

        return auditLog;
    }

}

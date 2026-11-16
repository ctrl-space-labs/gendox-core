package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.services.SecretsService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.batch.core.job.JobExecution;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Platform administration of the stored secrets. Nothing here returns a secret
 * or a key: only key ids and counts.
 */
@RestController
public class SecretsController {

    private final SecretsService secretsService;

    public SecretsController(SecretsService secretsService) {
        this.secretsService = secretsService;
    }

    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @GetMapping("/secrets/status")
    @Operation(summary = "How many stored secrets each encryption key holds",
            description = "A key that is not the current one and holds no values can be removed from the configuration.")
    public SecretsService.Status getStatus() {
        return secretsService.getStatus();
    }

    @PreAuthorize("@securityUtils.isSuperAdmin()")
    @PostMapping("/secrets/reencrypt")
    @Operation(summary = "Start the job that moves the stored secrets to the current key",
            description = "Run after the key list changed. The job runs in the background and can be run again; "
                    + "the status shows what is left.")
    public Map<String, Object> reencrypt() throws Exception {
        JobExecution jobExecution = secretsService.reencrypt();
        return Map.of("jobExecutionId", jobExecution.getId(), "status", jobExecution.getStatus().name());
    }
}

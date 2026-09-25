package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.decision.DecisionUsage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.DecisionModelApiAdapter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.OrganizationModelProviderKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DecisionServiceTest {
    @Mock private AiModelUtils aiModelUtils;
    @Mock private OrganizationModelKeyService modelKeyService;
    @Mock private AuditLogsService auditLogsService;
    @Mock private TypeService typeService;
    @Mock private DecisionModelApiAdapter adapter;

    private DecisionService service;
    private ProjectAgent agent;
    private AiModel model;
    private Type requestAuditType;
    private Type responseAuditType;

    @BeforeEach
    void setUp() throws Exception {
        service = new DecisionService(aiModelUtils, modelKeyService, auditLogsService, typeService);

        Project project = new Project();
        project.setId(UUID.randomUUID());
        project.setOrganizationId(UUID.randomUUID());

        model = new AiModel();
        model.setModel("jev-latest");
        model.setUrl("https://api.typesafe.ai/v1/systemone");
        model.setApiType(Type.builder().name("TYPESAFE_DECISION_API").build());

        agent = new ProjectAgent();
        agent.setProject(project);
        agent.setDecisionModel(model);

        OrganizationModelProviderKey key = new OrganizationModelProviderKey();
        key.setKey("secret");
        when(modelKeyService.getKeyForAgent(agent, "DECISION_MODEL")).thenReturn(key);
        when(aiModelUtils.getDecisionModelApiAdapterImpl("TYPESAFE_DECISION_API")).thenReturn(adapter);

        requestAuditType = Type.builder().name("DECISION_REQUEST").build();
        responseAuditType = Type.builder().name("DECISION_RESPONSE").build();
        when(typeService.getAuditLogTypeByName("DECISION_REQUEST")).thenReturn(requestAuditType);
        when(typeService.getAuditLogTypeByName("DECISION_RESPONSE")).thenReturn(responseAuditType);
    }

    @Test
    void registersInputAndOutputTokensInSeparateAuditLogs() throws Exception {
        DecisionRequest request = DecisionRequest.builder()
                .state(Map.of("document", "Example"))
                .questions(Map.of())
                .build();
        DecisionResponse response = DecisionResponse.builder()
                .model("jev-2026-09-15")
                .usage(DecisionUsage.builder().inputTokens(769L).outputTokens(352L).build())
                .build();
        when(adapter.evaluate(request, model, "secret")).thenReturn(response);

        AuditLogs requestAuditLog = new AuditLogs();
        AuditLogs responseAuditLog = new AuditLogs();
        when(auditLogsService.createDefaultAuditLogs(requestAuditType)).thenReturn(requestAuditLog);
        when(auditLogsService.createDefaultAuditLogs(responseAuditType)).thenReturn(responseAuditLog);

        assertThat(service.evaluate(agent, request)).isSameAs(response);

        assertThat(requestAuditLog.getTokenCount()).isEqualTo(769L);
        assertThat(requestAuditLog.getProjectId()).isEqualTo(agent.getProject().getId());
        assertThat(requestAuditLog.getOrganizationId()).isEqualTo(agent.getProject().getOrganizationId());
        assertThat(responseAuditLog.getTokenCount()).isEqualTo(352L);
        assertThat(responseAuditLog.getProjectId()).isEqualTo(agent.getProject().getId());
        assertThat(responseAuditLog.getOrganizationId()).isEqualTo(agent.getProject().getOrganizationId());
        verify(auditLogsService).saveAuditLogs(requestAuditLog);
        verify(auditLogsService).saveAuditLogs(responseAuditLog);
    }

    @Test
    void returnsDecisionResponseWhenProviderDoesNotReportTokenUsage() throws Exception {
        DecisionRequest request = DecisionRequest.builder().state("Example").questions(Map.of()).build();
        DecisionResponse response = DecisionResponse.builder().build();
        when(adapter.evaluate(request, model, "secret")).thenReturn(response);

        assertThat(service.evaluate(agent, request)).isSameAs(response);

        verify(auditLogsService, never()).createDefaultAuditLogs(any());
        verify(auditLogsService, never()).saveAuditLogs(any());
    }
}

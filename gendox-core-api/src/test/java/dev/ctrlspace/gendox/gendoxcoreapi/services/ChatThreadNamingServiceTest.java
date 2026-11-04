package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.AiModelRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatThreadNamingServiceTest {

    final AiModelRepository models = mock(AiModelRepository.class);
    final ChatThreadRepository threads = mock(ChatThreadRepository.class);
    final EmbeddingService embeddings = mock(EmbeddingService.class);
    final AiModelUtils aiModelUtils = mock(AiModelUtils.class);
    final AiModelApiAdapterService adapter = mock(AiModelApiAdapterService.class);
    final ChatThreadNamingService service = new ChatThreadNamingService(models, threads, embeddings, aiModelUtils,
            mock(AuditLogsService.class), mock(TypeService.class));

    final UUID organizationId = UUID.randomUUID();
    final Project project = new Project();
    final Message question = new Message();
    AiModel agentModel;
    AiModel haiku;

    @BeforeEach
    void setup() throws Exception {
        AiModelProvider anthropic = new AiModelProvider();
        anthropic.setId(UUID.randomUUID());
        agentModel = model("CLAUDE-OPUS", anthropic);
        agentModel.setId(UUID.randomUUID());
        haiku = model("CLAUDE-HAIKU", anthropic);

        ProjectAgent agent = new ProjectAgent();
        agent.setCompletionModel(agentModel);
        project.setId(UUID.randomUUID());
        project.setOrganizationId(organizationId);
        project.setProjectAgent(agent);
        question.setThreadId(UUID.randomUUID());
        question.setValue("How do I return an opened item after 30 days?");

        when(models.findActiveCompletionModelsByProviderCheapestFirst(anthropic.getId(), organizationId)).thenReturn(List.of(haiku, agentModel));
        when(aiModelUtils.getAiModelApiAdapterImpl("API")).thenReturn(adapter);
        when(models.findWithDetailsById(agentModel.getId())).thenReturn(Optional.of(agentModel));
    }

    private static AiModel model(String name, AiModelProvider provider) {
        AiModel model = new AiModel();
        model.setName(name);
        model.setAiModelProvider(provider);
        Type apiType = new Type();
        apiType.setName("API");
        model.setApiType(apiType);
        return model;
    }

    private void modelAnswers(String content) {
        Choice choice = new Choice();
        choice.setMessage(AiModelMessage.builder().role("assistant").content(content).build());
        CompletionResponse response = new CompletionResponse();
        response.setChoices(List.of(choice));
        when(adapter.askCompletion(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(response);
    }

    @Test
    void theThreadIsNamedWithTheCheapestModelOfTheAgentsProvider() {
        modelAnswers("\"Returning opened items.\"");

        service.nameThread(question, project);

        verify(adapter).askCompletion(any(), any(), eq(haiku), any(), any(), any(), any(), any());
        verify(threads).renameIfStillNamed(question.getThreadId(), "Returning opened items", "Chat Thread");
    }

    @Test
    void withoutAnotherModelTheAgentsOwnIsUsed() throws Exception {
        when(models.findActiveCompletionModelsByProviderCheapestFirst(any(), any())).thenReturn(List.of());

        assertSame(agentModel, service.smallestModelLike(agentModel.getId(), organizationId));
    }

    @Test
    void aFailingModelLeavesTheDefaultName() {
        when(adapter.askCompletion(any(), any(), any(), any(), any(), any(), any(), any())).thenThrow(new RuntimeException("rate limited"));

        assertDoesNotThrow(() -> service.nameThread(question, project));
        verify(threads, never()).renameIfStillNamed(any(), any(), any());
    }

    @Test
    void anEmptyAnswerRenamesNothing() {
        modelAnswers("  \n");

        service.nameThread(question, project);

        verify(threads, never()).renameIfStillNamed(any(), any(), any());
    }

    @Test
    void theNameIsOneShortLine() {
        assertEquals("Warranty coverage", ChatThreadNamingService.cleanName("**Warranty coverage**\nExplanation: ..."));
        assertEquals(60, ChatThreadNamingService.cleanName("x".repeat(100)).length());
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRequestDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.core.task.TaskExecutor;
import org.springframework.transaction.support.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ChatCompletionServiceTest {
    final ObjectMapper mapper = new ObjectMapper();
    final Map<UUID, Message> rows = new LinkedHashMap<>();
    final Map<UUID, CompletionTurn> storedTurns = new HashMap<>();
    final MessageRepository messages = mock(MessageRepository.class);
    final CompletionTurnRepository turns = mock(CompletionTurnRepository.class);
    final MessageService messageService = mock(MessageService.class);
    final ProjectService projects = mock(ProjectService.class);
    final TemplateRepository templates = mock(TemplateRepository.class);
    final MessageLocalContextService contexts = mock(MessageLocalContextService.class);
    final AiToolRegistry registry = mock(AiToolRegistry.class);
    final TaskExecutor executor = mock(TaskExecutor.class);
    final TransactionTemplate tx = mock(TransactionTemplate.class);
    final Project project = new Project();
    ChatCompletionService service;
    ChatCompletionRun run;

    @BeforeEach void setup() throws Exception {
        when(tx.execute(any())).thenAnswer(i -> ((TransactionCallback<?>)i.getArgument(0)).doInTransaction(mock(org.springframework.transaction.TransactionStatus.class)));
        var agent = new ProjectAgent(); agent.setUserId(UUID.randomUUID()); agent.setAgentBehavior("Use search");
        agent.setAiTools(new ArrayList<>()); agent.setChatTemplateId(UUID.randomUUID());
        AiModel model = new AiModel(); model.setId(UUID.randomUUID());
        var provider = new AiModelProvider(); provider.setName("test"); model.setAiModelProvider(provider);
        var type = new Type(); type.setName("OPEN_AI_API"); model.setApiType(type); agent.setCompletionModel(model);
        project.setId(UUID.randomUUID()); project.setProjectAgent(agent);
        Template template = new Template(); template.setText("${question}\n${localContexts}");
        when(templates.findByIdIs(any())).thenReturn(template);
        when(projects.getProjectById(any())).thenReturn(project);
        when(registry.getOpenAiToolDefinitions("advanced_search")).thenReturn((com.fasterxml.jackson.databind.node.ArrayNode)mapper.readTree("[{\"function\":{\"name\":\"advanced_search\",\"parameters\":{\"type\":\"object\"}}}]"));
        when(contexts.getImageContentPartsFromLocalContext(any(), eq(true))).thenReturn(List.of());
        when(messageService.createMessage(any())).thenAnswer(i -> {
            Message m = i.getArgument(0); m.setId(UUID.randomUUID()); m.setCreatedAt(Instant.parse("2026-10-16T10:00:00Z"));
            if (m.getThreadId() == null) m.setThreadId(UUID.randomUUID());
            if (m.getRole() == null) m.setRole("user");
            m.setMessageSections(new ArrayList<>()); rows.put(m.getId(), m); return m;
        });
        when(messageService.createMessageSection(any())).thenAnswer(i -> i.getArgument(0));
        when(messageService.updateMessageWithSections(any(), anyList())).thenAnswer(i -> {
            Message m = i.getArgument(0); m.setMessageSections(i.getArgument(1)); return m;
        });
        when(messages.findAllById(any())).thenAnswer(i -> { Iterable<UUID> ids = i.getArgument(0); var list = new ArrayList<Message>(); ids.forEach(id -> list.add(rows.get(id))); return list; });
        when(messages.findWithContextsByIds(anyList())).thenAnswer(i -> ((List<UUID>)i.getArgument(0)).stream().map(rows::get).toList());
        when(messages.findWithSectionsByIds(anyList())).thenAnswer(i -> ((List<UUID>)i.getArgument(0)).stream().map(rows::get).toList());
        when(messages.findHistoryIds(any(), any(), any())).thenReturn(List.of());
        when(turns.findByThreadIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        when(turns.saveAndFlush(any())).thenAnswer(i -> { CompletionTurn t = i.getArgument(0); storedTurns.put(t.getId(), t); return t; });
        when(turns.save(any())).thenAnswer(i -> { CompletionTurn t = i.getArgument(0); storedTurns.put(t.getId(), t); return t; });
        when(turns.lock(any())).thenAnswer(i -> Optional.ofNullable(storedTurns.get(i.getArgument(0))));
        when(turns.findFirstByThreadIdOrderByCreatedAtDesc(any())).thenAnswer(i -> storedTurns.values().stream().filter(t -> t.getThreadId().equals(i.getArgument(0))).findFirst());
        when(turns.findByStatusAndDeadlineBefore(anyString(), any())).thenAnswer(i -> storedTurns.values().stream()
                .filter(t -> i.getArgument(0).equals(t.getStatus()) && t.getDeadline() != null && t.getDeadline().isBefore(i.getArgument(1))).toList());
        when(turns.findByStatusAndHeartbeatBefore(anyString(), any())).thenReturn(List.of());
        var history = new ChatHistoryService(messages, turns, new MessageAiMessageConverter(), contexts, templates);
        service = new ChatCompletionService(turns, messages, messageService, history, mock(CompletionService.class), projects,
                mock(UserService.class), templates, registry, mock(SecurityUtils.class), mapper, tx, mock(EntityManager.class), executor);
        Message input = new Message(); input.setValue("question"); input.setProjectId(project.getId());
        run = service.begin(input, project, CompletionRequestDTO.builder().clientToolResults(true).build(), (event, value) -> {});
    }
    private void pause() throws Exception {
        Message assistant = new Message(); assistant.setRole("assistant"); assistant.setThreadId(run.turn().getThreadId());
        assistant.setToolCalls(mapper.readTree("[{\"id\":\"a\",\"function\":{\"name\":\"lookup\",\"arguments\":\"{}\"}},{\"id\":\"b\",\"function\":{\"name\":\"lookup\",\"arguments\":\"{}\"}}]"));
        assistant = run.create(assistant);
        var tool = AiTools.builder().type("function").execution("CLIENT").build();
        for (JsonNode call : assistant.getToolCalls()) assertTrue(run.defer(assistant, call, tool, false));
        assertTrue(run.waitForTools());
    }
    private ChatCompletionRun reply(String call, String value, String token) {
        return service.reply(CompletionRequestDTO.builder().role("tool").threadId(run.turn().getThreadId())
                .toolCallId(call).value(value).stream(true).build(), project.getId(), token, (event, data) -> {});
    }
    @Test void outOfOrderResultsResumeOnlyOnceAndReconstructOriginalMessagePrefix() throws Exception {
        pause();
        var before = run.messages();
        assertNull(reply("b", "{ \"b\": 2 }", run.resumeToken()));
        assertEquals("WAITING_FOR_TOOLS", run.turn().getStatus());
        ChatCompletionRun resumed = reply("a", "{ \"a\": 1 }", run.resumeToken());
        assertNotNull(resumed);
        var after = resumed.messages();
        assertEquals(mapper.writeValueAsString(before), mapper.writeValueAsString(after.subList(0, before.size())));
        assertEquals(List.of("a", "b"), after.subList(before.size(), after.size()).stream().map(m -> m.getToolCallId()).toList());
        assertEquals(4, rows.size()); // original user, assistant call, two tool results
        assertNull(reply("b", "{ \"b\": 2 }", run.resumeToken()));
        assertEquals(4, rows.size());
        assertThrows(GendoxRuntimeException.class, () -> reply("b", "different", run.resumeToken()));
    }
    @Test void rejectsForeignSessionUnknownCallAndChangedConfiguration() throws Exception {
        pause();
        assertThrows(GendoxRuntimeException.class, () -> reply("a", "result", "wrong"));
        assertThrows(GendoxRuntimeException.class, () -> reply("unknown", "result", run.resumeToken()));
        project.getProjectAgent().setAgentBehavior("changed");
        assertThrows(GendoxRuntimeException.class, () -> reply("a", "result", run.resumeToken()));
        assertEquals(2, rows.size());
        assertEquals("FAILED", run.turn().getStatus());
    }
    @Test void timeoutSavesOnlyMissingResultsAndClaimsOneContinuation() throws Exception {
        pause(); reply("a", "saved", run.resumeToken());
        run.turn().setDeadline(Instant.now().minusSeconds(1));
        service.maintainTurns(); service.maintainTurns();
        assertEquals(4, rows.size());
        assertEquals("GENERATING", run.turn().getStatus());
        assertEquals(1, rows.values().stream().filter(m -> "b".equals(m.getToolCallId()) && m.getValue().contains("CLIENT_TOOL_TIMEOUT")).count());
        verify(executor, times(1)).execute(any(Runnable.class));
    }
    @Test void failedWorkerClosesMissingToolResultsWithoutRepeatingActions() throws Exception {
        pause();
        run.turn().setStatus("GENERATING"); run.turn().setPendingCalls(new ArrayList<>());
        CompletionService completions = (CompletionService)org.springframework.test.util.ReflectionTestUtils.getField(service, "completions");
        when(completions.getCompletion(any(), anyList(), any(), any(), any(), eq(run))).thenThrow(new IllegalStateException("provider unavailable"));
        assertThrows(GendoxRuntimeException.class, () -> service.execute(run));
        assertEquals("FAILED", run.turn().getStatus());
        assertEquals(2, rows.values().stream().filter(m -> "tool".equals(m.getRole()) && m.getValue().contains("COMPLETION_INTERRUPTED")).count());
        assertEquals(List.of("a", "b"), run.messages().stream().filter(m -> "tool".equals(m.getRole())).map(m -> m.getToolCallId()).toList());
    }
    @Test void statusReturnsOnlyUnansweredCalls() throws Exception {
        pause(); reply("a", "saved", run.resumeToken());
        @SuppressWarnings("unchecked")
        var pending = (List<CompletionTurn.PendingCall>)service.status(run.turn().getThreadId(), run.resumeToken()).get("pendingCalls");
        assertEquals(List.of("b"), pending.stream().map(CompletionTurn.PendingCall::id).toList());
    }
    @Test void backendHandlersTakePrecedenceAndLegacyActionsDoNotPause() throws Exception {
        Message assistant = new Message(); assistant.setId(UUID.randomUUID());
        JsonNode call = mapper.readTree("{\"id\":\"a\",\"function\":{\"name\":\"lookup\",\"arguments\":\"{}\"}}");
        assertFalse(run.defer(assistant, call, AiTools.builder().execution("CLIENT").build(), true));
        assertFalse(run.defer(assistant, call, AiTools.builder().build(), false));
        assertFalse(run.waitForTools());
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import tools.jackson.databind.json.JsonMapper;

import tools.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn.PendingCall;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionStatusDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.CompletionTurnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CompletionTurnServiceTest {

    final UUID threadId = UUID.randomUUID();
    final UUID projectId = UUID.randomUUID();
    final CompletionTurnRepository turnRepository = mock(CompletionTurnRepository.class);
    final MessageRepository messageRepository = mock(MessageRepository.class);
    final MessageService messageService = mock(MessageService.class);
    final ProjectService projectService = mock(ProjectService.class);
    final CompletionService completionService = mock(CompletionService.class);
    final SecurityUtils securityUtils = mock(SecurityUtils.class);
    // What the fake tables hold
    final Map<UUID, CompletionTurn> turns = new HashMap<>();
    final List<Message> savedMessages = new ArrayList<>();

    CompletionTurnService service;
    Message question;
    Message assistant;

    @BeforeEach
    void setup() throws Exception {
        Project project = new Project();
        project.setProjectAgent(new ProjectAgent());
        when(projectService.getProjectById(projectId)).thenReturn(project);
        when(turnRepository.save(any())).thenAnswer(invocation -> {
            CompletionTurn turn = invocation.getArgument(0);
            turns.put(turn.getId(), turn);
            return turn;
        });
        when(turnRepository.findById(any())).thenAnswer(invocation -> Optional.ofNullable(turns.get(invocation.getArgument(0))));
        when(turnRepository.lockWaitingTurn(threadId)).thenAnswer(invocation -> waitingTurn());
        when(turnRepository.findByThreadIdAndStatus(threadId, CompletionTurn.WAITING_FOR_TOOLS)).thenAnswer(invocation -> waitingTurn());
        when(messageService.createMessage(any())).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            savedMessages.add(message);
            return message;
        });
        when(messageRepository.findFirstByThreadIdAndRoleAndToolCallIdOrderByCreatedAtDesc(eq(threadId), eq("tool"), anyString()))
                .thenAnswer(invocation -> savedMessages.stream()
                        .filter(message -> message.getToolCallId().equals(invocation.getArgument(2)))
                        .findFirst());

        service = new CompletionTurnService(turnRepository, messageRepository, messageService, projectService,
                completionService, securityUtils);

        question = new Message();
        question.setId(UUID.randomUUID());
        question.setThreadId(threadId);
        question.setProjectId(projectId);
        assistant = new Message();
        assistant.setId(UUID.randomUUID());
    }

    private Optional<CompletionTurn> waitingTurn() {
        return turns.values().stream()
                .filter(turn -> CompletionTurn.WAITING_FOR_TOOLS.equals(turn.getStatus()))
                .findFirst();
    }

    private CompletionTurn suspendWithTwoCalls() {
        List<PendingCall> calls = List.of(
                new PendingCall("a", assistant.getId(), "lookup", "{}"),
                new PendingCall("b", assistant.getId(), "lookup", "{}"));
        return service.suspend(question, assistant, calls, 1);
    }

    private Optional<CompletionTurn> answer(String callId, String value, String token) throws Exception {
        return service.saveResult(threadId, callId, value, projectId, token);
    }

    @Test
    void anAnonymousSessionGetsAResumeTokenAndOnlyItsHashIsKept() {
        CompletionTurn turn = suspendWithTwoCalls();

        assertNotNull(turn.getResumeToken());
        assertNotNull(turn.getSessionHash());
        assertNotEquals(turn.getResumeToken(), turn.getSessionHash());
        assertEquals(question.getId(), turn.getUserMessageId());
        assertEquals(CompletionTurn.WAITING_FOR_TOOLS, turn.getStatus());
    }

    @Test
    void theTurnResumesOnlyWhenEveryCallHasAResult() throws Exception {
        String token = suspendWithTwoCalls().getResumeToken();

        assertTrue(answer("b", "2", token).isEmpty());
        Optional<CompletionTurn> resumed = answer("a", "1", token);

        assertTrue(resumed.isPresent());
        assertEquals(CompletionTurn.RESUMED, resumed.get().getStatus());
        assertEquals(List.of("b", "a"), savedMessages.stream().map(Message::getToolCallId).toList());
    }

    @Test
    void aRepeatedResultIsIgnoredAndADifferentOneIsRejected() throws Exception {
        String token = suspendWithTwoCalls().getResumeToken();
        answer("a", "1", token);

        assertTrue(answer("a", "1", token).isEmpty());
        assertEquals(HttpStatus.CONFLICT, assertThrows(GendoxException.class, () -> answer("a", "other", token)).getHttpStatus());
        assertEquals(1, savedMessages.size());
    }

    @Test
    void anotherSessionCannotAnswer() {
        suspendWithTwoCalls();

        assertEquals(HttpStatus.FORBIDDEN, assertThrows(GendoxException.class, () -> answer("a", "1", "someone-else")).getHttpStatus());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(GendoxException.class, () -> answer("a", "1", null)).getHttpStatus());
        assertTrue(savedMessages.isEmpty());
    }

    @Test
    void aSignedInUserAnswersWithoutAToken() throws Exception {
        UUID userId = UUID.randomUUID();
        when(securityUtils.getUserId()).thenReturn(userId);
        suspendWithTwoCalls();

        answer("a", "1", null);

        when(securityUtils.getUserId()).thenReturn(UUID.randomUUID());
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(GendoxException.class, () -> answer("b", "2", null)).getHttpStatus());
    }

    @Test
    void aCallTheTurnDoesNotWaitForIsRejected() {
        String token = suspendWithTwoCalls().getResumeToken();

        assertEquals(HttpStatus.CONFLICT, assertThrows(GendoxException.class, () -> answer("unknown", "1", token)).getHttpStatus());
        assertTrue(savedMessages.isEmpty());
    }

    @Test
    void aResultNeedsAThreadACallAndAValue() {
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(GendoxException.class, () -> service.saveResult(null, "a", "1", projectId, null)).getHttpStatus());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(GendoxException.class, () -> service.saveResult(threadId, null, "1", projectId, null)).getHttpStatus());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(GendoxException.class, () -> service.saveResult(threadId, "a", null, projectId, null)).getHttpStatus());
    }

    @Test
    void aNewMessageCancelsTheWaitingCalls() throws Exception {
        suspendWithTwoCalls();

        service.cancelWaitingTurn(threadId);

        assertEquals(2, savedMessages.stream().filter(message -> message.getValue().contains("CLIENT_TOOL_CANCELLED")).count());
        assertTrue(waitingTurn().isEmpty());
    }

    @Test
    void aWaitingTurnListsItsCallsOnlyToTheSessionThatMayAnswer() {
        String token = suspendWithTwoCalls().getResumeToken();

        CompletionStatusDTO owner = service.getStatus(threadId, token);
        CompletionStatusDTO other = service.getStatus(threadId, "someone-else");

        assertEquals(CompletionTurn.WAITING_FOR_TOOLS, owner.status());
        assertEquals(2, owner.pendingCalls().size());
        assertEquals(question.getId(), owner.turnId());
        assertTrue(other.pendingCalls().isEmpty());
    }

    @Test
    void withoutAWaitingTurnTheLatestMessageTellsWhetherATurnStillRuns() throws Exception {
        Message latest = new Message();
        latest.setRole("user");
        latest.setCreatedAt(Instant.now());
        when(messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(threadId)).thenReturn(Optional.of(latest));
        assertEquals("GENERATING", service.getStatus(threadId, null).status());

        latest.setRole("assistant");
        assertEquals("IDLE", service.getStatus(threadId, null).status());

        latest.setToolCalls(JsonMapper.shared().readTree("[{\"id\":\"a\"}]"));
        assertEquals("GENERATING", service.getStatus(threadId, null).status());

        latest.setCreatedAt(Instant.now().minusSeconds(600));
        assertEquals("IDLE", service.getStatus(threadId, null).status());
    }

    @Test
    void aFailedTurnIsReportedAtOnceUntilTheNextQuestion() throws Exception {
        // the turn waited for a tool, resumed, then the model call failed
        String token = suspendWithTwoCalls().getResumeToken();
        answer("a", "1", token);
        answer("b", "2", token);
        service.fail(question);
        question.setRole("user");
        question.setCreatedAt(Instant.now());
        when(messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(threadId)).thenReturn(Optional.of(savedMessages.getLast()));
        when(messageRepository.findFirstByThreadIdAndRoleOrderByCreatedAtDesc(threadId, "user")).thenReturn(Optional.of(question));

        CompletionStatusDTO failed = service.getStatus(threadId, null);
        assertEquals(CompletionTurn.FAILED, failed.status());
        assertEquals(question.getId(), failed.turnId());

        Message next = new Message();
        next.setId(UUID.randomUUID());
        next.setRole("user");
        next.setCreatedAt(Instant.now());
        when(messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(threadId)).thenReturn(Optional.of(next));
        when(messageRepository.findFirstByThreadIdAndRoleOrderByCreatedAtDesc(threadId, "user")).thenReturn(Optional.of(next));
        assertEquals("GENERATING", service.getStatus(threadId, null).status());
    }

    @Test
    void aTurnThatFailsBeforeAnyMessageIsSavedWithoutOne() {
        service.fail(question);

        CompletionTurn turn = turns.get(question.getId());
        assertEquals(CompletionTurn.FAILED, turn.getStatus());
        assertNull(turn.getAssistantMessageId());
        assertTrue(turn.getPendingCalls().isEmpty());
    }

    @Test
    void savingAFailedTurnNeverThrows() {
        doThrow(new RuntimeException("database down")).when(turnRepository).save(any());

        assertDoesNotThrow(() -> service.fail(question));
    }
}

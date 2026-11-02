package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn.PendingCall;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionStatusDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.CompletionTurnRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Chat turns that wait for CLIENT tool results (#518): the page or app runs the tool and posts the
 * result back, and the turn continues once every waiting call has one. The backend sets no time limit:
 * a call waits until its result arrives or a new user message cancels it.
 */
@Service
public class CompletionTurnService {

    // A turn whose latest message is newer than this, and is not a final answer, is shown as generating
    private static final Duration GENERATING_WINDOW = Duration.ofMinutes(5);

    private static final String CANCELLED_RESULT = "{\"error\":\"CLIENT_TOOL_CANCELLED\",\"message\":\"The user sent a new message before the page returned a result\"}";

    private final CompletionTurnRepository turnRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final ProjectService projectService;
    private final CompletionService completionService;
    private final SecurityUtils securityUtils;

    public CompletionTurnService(CompletionTurnRepository turnRepository,
                                 MessageRepository messageRepository,
                                 MessageService messageService,
                                 ProjectService projectService,
                                 @Lazy CompletionService completionService,
                                 SecurityUtils securityUtils) {
        this.turnRepository = turnRepository;
        this.messageRepository = messageRepository;
        this.messageService = messageService;
        this.projectService = projectService;
        this.completionService = completionService;
        this.securityUtils = securityUtils;
    }

    /**
     * Stops the turn of {@code userMessage} to wait for the given calls of {@code assistant}. A turn that
     * waits again after resuming keeps its row, so the session that may answer stays the same.
     */
    @Transactional
    public CompletionTurn suspend(Message userMessage, Message assistant, List<PendingCall> calls, int iteration) {
        CompletionTurn turn = turnRepository.findById(userMessage.getId()).orElseGet(() -> newTurn(userMessage));
        turn.setAssistantMessageId(assistant.getId());
        turn.setStatus(CompletionTurn.WAITING_FOR_TOOLS);
        turn.setPendingCalls(new ArrayList<>(calls));
        turn.setIteration(iteration);
        String resumeToken = turn.getResumeToken();
        turn = turnRepository.save(turn);
        turn.setResumeToken(resumeToken);
        return turn;
    }

    // The turn row reuses the id of its user message: one turn per user message
    private CompletionTurn newTurn(Message userMessage) {
        CompletionTurn turn = new CompletionTurn();
        turn.setId(userMessage.getId());
        turn.setThreadId(userMessage.getThreadId());
        turn.setProjectId(userMessage.getProjectId());
        turn.setUserMessageId(userMessage.getId());
        turn.setCreatedAt(Instant.now());
        turn.setActorId(securityUtils.getUserId());
        if (turn.getActorId() == null) {
            String resumeToken = UUID.randomUUID() + "." + UUID.randomUUID();
            turn.setResumeToken(resumeToken);
            turn.setSessionHash(sha256(resumeToken));
        }
        return turn;
    }

    /**
     * Saves the result of one CLIENT call of the thread's waiting turn. Returns the turn, now RESUMED,
     * once every call it waits for has a result; empty while it still waits for others, or when the
     * same result was already saved (a retry).
     */
    @Transactional
    public Optional<CompletionTurn> saveResult(UUID threadId, String toolCallId, String value,
                                               UUID projectId, String resumeToken) throws GendoxException {
        if (threadId == null || toolCallId == null || value == null) {
            throw new GendoxRuntimeException(HttpStatus.BAD_REQUEST, "INVALID_TOOL_RESULT", "A tool result needs a threadId, a toolCallId and a value");
        }
        Optional<CompletionTurn> waiting = turnRepository.lockWaitingTurn(threadId);
        Optional<PendingCall> call = waiting.flatMap(turn -> pendingCall(turn, toolCallId));
        if (call.isEmpty()) {
            requireSaved(threadId, toolCallId, value);
            return Optional.empty();
        }

        CompletionTurn turn = waiting.get();
        if (!turn.getProjectId().equals(projectId) || !canAnswer(turn, resumeToken)) {
            throw forbidden();
        }
        saveToolMessage(turn, call.get(), value);
        List<PendingCall> stillPending = new ArrayList<>(turn.getPendingCalls());
        stillPending.remove(call.get());
        turn.setPendingCalls(stillPending);
        if (!stillPending.isEmpty()) {
            turnRepository.save(turn);
            return Optional.empty();
        }
        turn.setStatus(CompletionTurn.RESUMED);
        return Optional.of(turnRepository.save(turn));
    }

    private static Optional<PendingCall> pendingCall(CompletionTurn turn, String toolCallId) {
        return turn.getPendingCalls().stream()
                .filter(pending -> pending.id().equals(toolCallId))
                .findFirst();
    }

    /** A call that is no longer waiting is fine only when the very same result was saved for it. */
    private void requireSaved(UUID threadId, String toolCallId, String value) {
        Optional<Message> saved = messageRepository
                .findFirstByThreadIdAndRoleAndToolCallIdOrderByCreatedAtDesc(threadId, "tool", toolCallId);
        if (saved.isEmpty()) {
            throw new GendoxRuntimeException(HttpStatus.CONFLICT, "TOOL_CALL_NOT_WAITING", "This tool call is not waiting for a result");
        }
        if (!saved.get().getValue().equals(value)) {
            throw new GendoxRuntimeException(HttpStatus.CONFLICT, "TOOL_RESULT_CONFLICT", "A different result is already saved for this tool call");
        }
    }

    /** A new user message ends a waiting turn: its unanswered calls are answered as cancelled. */
    @Transactional
    public void cancelWaitingTurn(UUID threadId) throws GendoxException {
        Optional<CompletionTurn> waiting = turnRepository.lockWaitingTurn(threadId);
        if (waiting.isEmpty()) {
            return;
        }
        CompletionTurn turn = waiting.get();
        answerPendingCalls(turn, CANCELLED_RESULT);
        turn.setStatus(CompletionTurn.CANCELLED);
        turnRepository.save(turn);
    }

    public CompletionStatusDTO getStatus(UUID threadId, String resumeToken) {
        Optional<CompletionTurn> waiting = turnRepository.findByThreadIdAndStatus(threadId, CompletionTurn.WAITING_FOR_TOOLS);
        if (waiting.isPresent()) {
            CompletionTurn turn = waiting.get();
            return CompletionStatusDTO.waiting(turn, canAnswer(turn, resumeToken));
        }
        Optional<Message> latest = messageRepository.findFirstByThreadIdOrderByCreatedAtDesc(threadId);
        if (latest.isPresent() && isGenerating(latest.get())) {
            return CompletionStatusDTO.of(threadId, "GENERATING");
        }
        return CompletionStatusDTO.of(threadId, "IDLE");
    }

    // No state is kept while a turn generates: a recent message that is not a final answer means it still runs
    private static boolean isGenerating(Message latest) {
        if (latest.getCreatedAt().isBefore(Instant.now().minus(GENERATING_WINDOW))) {
            return false;
        }
        boolean hasToolCalls = latest.getToolCalls() != null && !latest.getToolCalls().isEmpty();
        boolean finalAnswer = "assistant".equals(latest.getRole()) && !hasToolCalls;
        return !finalAnswer;
    }

    private void answerPendingCalls(CompletionTurn turn, String result) throws GendoxException {
        for (PendingCall call : turn.getPendingCalls()) {
            saveToolMessage(turn, call, result);
        }
        turn.setPendingCalls(new ArrayList<>());
    }

    private void saveToolMessage(CompletionTurn turn, PendingCall call, String value) throws GendoxException {
        UUID agentUserId = projectService.getProjectById(turn.getProjectId()).getProjectAgent().getUserId();
        Message result = new Message();
        result.setRole("tool");
        result.setName(call.name());
        result.setToolCallId(call.id());
        result.setValue(value);
        result.setThreadId(turn.getThreadId());
        result.setProjectId(turn.getProjectId());
        result.setCreatedBy(agentUserId);
        result.setUpdatedBy(agentUserId);
        messageService.createMessage(result);
    }

    private boolean canAnswer(CompletionTurn turn, String resumeToken) {
        if (turn.getActorId() != null) {
            return turn.getActorId().equals(securityUtils.getUserId());
        }
        if (resumeToken == null) {
            return false;
        }
        return MessageDigest.isEqual(turn.getSessionHash().getBytes(StandardCharsets.UTF_8),
                sha256(resumeToken).getBytes(StandardCharsets.UTF_8));
    }

    private static GendoxRuntimeException forbidden() {
        return new GendoxRuntimeException(HttpStatus.FORBIDDEN, "FORBIDDEN_COMPLETION_TURN", "This session cannot answer these tool calls");
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

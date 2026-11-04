package dev.ctrlspace.gendox.gendoxcoreapi.model.dtos;

import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;

import java.util.List;
import java.util.UUID;

/**
 * Where the latest chat turn of a thread stands: IDLE, GENERATING, WAITING_FOR_TOOLS or FAILED.
 * The turn is identified by its user message. Pending calls are listed only to the session that may answer them.
 */
public record CompletionStatusDTO(UUID threadId,
                                  UUID turnId,
                                  String status,
                                  List<CompletionTurn.PendingCall> pendingCalls,
                                  String resumeToken) {

    public static CompletionStatusDTO of(UUID threadId, String status) {
        return new CompletionStatusDTO(threadId, null, status, List.of(), null);
    }

    public static CompletionStatusDTO failed(CompletionTurn turn) {
        return new CompletionStatusDTO(turn.getThreadId(), turn.getUserMessageId(), CompletionTurn.FAILED, List.of(), null);
    }

    public static CompletionStatusDTO waiting(CompletionTurn turn, boolean withCalls) {
        List<CompletionTurn.PendingCall> calls = List.of();
        if (withCalls) {
            calls = turn.getPendingCalls();
        }
        return new CompletionStatusDTO(turn.getThreadId(), turn.getUserMessageId(), turn.getStatus(), calls,
                turn.getResumeToken());
    }
}

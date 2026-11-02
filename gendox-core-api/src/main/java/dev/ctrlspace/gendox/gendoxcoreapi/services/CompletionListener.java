package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;

import java.util.List;
import java.util.function.Consumer;

/**
 * The client a completion is answering. This base class is a JSON client: it receives nothing while
 * the completion runs. A streaming client overrides the callbacks.
 */
public class CompletionListener {

    private final boolean waitsForClientTools;
    private CompletionTurn waitingTurn;

    /**
     * @param waitsForClientTools whether this client runs CLIENT tools and sends their results back,
     *                            so the turn may stop and wait for them
     */
    public CompletionListener(boolean waitsForClientTools) {
        this.waitsForClientTools = waitsForClientTools;
    }

    /** For internal callers: no client, no streaming, no waiting. */
    public static CompletionListener none() {
        return new CompletionListener(false);
    }

    public boolean waitsForClientTools() {
        return waitsForClientTools;
    }

    /** Receives the model's tokens; null means the provider is not asked to stream. */
    public Consumer<CompletionDelta> deltas() {
        return null;
    }

    /** A message of the turn was saved: an assistant message or a tool result. */
    public void onMessage(Message message) {
    }

    /** The assistant called tools the page or app acts on (ACTION); the agent was told they were executed. */
    public void onClientToolCalls(Message assistant, List<JsonNode> toolCalls) {
    }

    /** The turn stopped to wait for the results of CLIENT tool calls. */
    public void onWaitingForTools(CompletionTurn turn) {
        this.waitingTurn = turn;
    }

    /** The turn this completion stopped at, or null when it answered. */
    public CompletionTurn getWaitingTurn() {
        return waitingTurn;
    }
}

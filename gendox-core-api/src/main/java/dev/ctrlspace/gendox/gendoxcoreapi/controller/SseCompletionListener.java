package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionStatusDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.CompletionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Sends a chat completion to the browser as Server-Sent Events while it runs in the background:
 * start, delta, message, tool_calls, then done, waiting_for_tools or error. A browser that goes away
 * only stops receiving events; the completion continues and its messages are saved.
 */
public class SseCompletionListener extends CompletionListener {

    private static final Logger logger = LoggerFactory.getLogger(SseCompletionListener.class);

    private static final long TIMEOUT_MILLIS = Duration.ofMinutes(10).toMillis();
    // Proxies close an idle stream, so a comment is sent while a slow model or tool keeps it quiet
    private static final long KEEPALIVE_SECONDS = 15;
    private static final ScheduledExecutorService KEEPALIVE = Executors.newSingleThreadScheduledExecutor(runnable -> {
        Thread thread = new Thread(runnable, "chat-sse-keepalive");
        thread.setDaemon(true);
        return thread;
    });

    /** A chat completion, run with the listener it reports to. */
    @FunctionalInterface
    public interface ChatCompletion {
        CompletionMessageDTO run(CompletionListener listener) throws Exception;
    }

    private final SseEmitter emitter = new SseEmitter(TIMEOUT_MILLIS);
    private final UUID threadId;
    // A turn is identified by its question
    private final UUID turnId;
    private final ScheduledFuture<?> keepalive;
    private volatile boolean connected = true;
    // Position of the next message in this stream; deltas belong to it
    private int messageIndex = 0;

    public SseCompletionListener(Message question, boolean waitsForClientTools) {
        super(waitsForClientTools);
        this.threadId = question.getThreadId();
        this.turnId = question.getId();
        emitter.onCompletion(this::disconnect);
        emitter.onTimeout(this::disconnect);
        emitter.onError(error -> disconnect());
        keepalive = KEEPALIVE.scheduleAtFixedRate(this::sendKeepalive, KEEPALIVE_SECONDS, KEEPALIVE_SECONDS, TimeUnit.SECONDS);
    }

    public SseEmitter getEmitter() {
        return emitter;
    }

    /** Runs the completion and ends the stream. Meant to run on a background thread. */
    public void run(ChatCompletion completion) {
        send("start", Map.of("threadId", threadId, "turnId", turnId));
        try {
            CompletionMessageDTO result = completion.run(this);
            if (getWaitingTurn() == null) {
                send("done", result);
            }
        } catch (Exception e) {
            logger.error("Chat completion for message {} failed", turnId, e);
            send("error", Map.of("threadId", threadId, "turnId", turnId, "message", "Completion failed; reload the saved messages."));
        } finally {
            keepalive.cancel(false);
            if (connected) {
                emitter.complete();
            }
        }
    }

    @Override
    public Consumer<CompletionDelta> deltas() {
        return delta -> send("delta", Map.of("turnId", turnId, "messageIndex", messageIndex,
                "field", delta.field(), "text", delta.text()));
    }

    @Override
    public void onMessage(Message message) {
        send("message", Map.of("threadId", threadId, "turnId", turnId, "messageIndex", messageIndex, "message", message));
        messageIndex++;
    }

    @Override
    public void onClientToolCalls(Message assistant, List<JsonNode> toolCalls) {
        send("tool_calls", Map.of("threadId", threadId, "turnId", turnId, "messageId", assistant.getId(),
                "execution", "ACTION", "toolCalls", toolCalls));
    }

    @Override
    public void onWaitingForTools(CompletionTurn turn) {
        super.onWaitingForTools(turn);
        send("waiting_for_tools", CompletionStatusDTO.waiting(turn, true));
    }

    private synchronized void send(String event, Object data) {
        if (!connected) {
            return;
        }
        try {
            emitter.send(SseEmitter.event().name(event).data(data));
        } catch (Exception e) {
            logger.debug("Browser left chat stream {}; the completion continues", turnId);
            disconnect();
        }
    }

    private synchronized void sendKeepalive() {
        if (!connected) {
            return;
        }
        try {
            emitter.send(SseEmitter.event().comment("keepalive"));
        } catch (Exception e) {
            disconnect();
        }
    }

    private void disconnect() {
        connected = false;
        keepalive.cancel(false);
    }
}

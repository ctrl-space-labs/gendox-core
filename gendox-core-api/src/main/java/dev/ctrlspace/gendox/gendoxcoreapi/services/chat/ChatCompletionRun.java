package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.JsonNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import java.util.*;
import java.util.function.*;

/** Request-local bridge: CompletionService stays unaware of SSE and database turn coordination. */
public final class ChatCompletionRun {
    private final ChatCompletionService service;
    private final Project project;
    private final List<AiTools> tools;
    private final BiConsumer<String, Object> events;
    private final boolean streaming;
    private final String resumeToken;
    private CompletionTurn turn;

    ChatCompletionRun(ChatCompletionService service, CompletionTurn turn, Project project, List<AiTools> tools,
                      boolean streaming, String resumeToken, BiConsumer<String, Object> events) {
        this.service = service; this.turn = turn; this.project = project; this.tools = tools;
        this.streaming = streaming; this.resumeToken = resumeToken; this.events = events;
    }
    public CompletionTurn turn() { return turn; }
    void turn(CompletionTurn turn) { this.turn = turn; }
    public Project project() { return project; }
    public List<AiTools> tools() { return tools; }
    public boolean isStreaming() { return streaming; }
    public String resumeToken() { return resumeToken; }
    public List<AiModelMessage> messages() { return service.history(this); }
    public Consumer<CompletionDelta> deltas() {
        if (!streaming) return null;
        int index = turn.getMessageIds().size();
        return delta -> emit("delta", Map.of("turnId", turn.getId(), "messageIndex", index,
                "field", delta.field(), "text", delta.text()));
    }
    public Message create(Message message) { return service.create(this, message); }
    public boolean defer(Message assistant, JsonNode call, AiTools tool, boolean backend) {
        return service.defer(this, assistant, call, tool, backend);
    }
    public boolean waitForTools() { return service.waitForTools(this); }
    public void emit(String event, Object data) { events.accept(event, data); }
    public void warning(String text) { service.warning(this, text); }
}

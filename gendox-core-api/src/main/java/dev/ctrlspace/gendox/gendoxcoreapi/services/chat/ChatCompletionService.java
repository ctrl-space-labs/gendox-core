package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxRuntimeException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.concurrent.DelegatingSecurityContextRunnable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.*;
import java.util.stream.Collectors;

@Service
public class ChatCompletionService {
    private final CompletionTurnRepository turns;
    private final MessageRepository messages;
    private final MessageService messageService;
    private final ChatHistoryService history;
    private final CompletionService completions;
    private final ProjectService projects;
    private final UserService users;
    private final TemplateRepository templates;
    private final AiToolRegistry registry;
    private final SecurityUtils security;
    private final ObjectMapper mapper;
    private final TransactionTemplate tx;
    private final EntityManager entities;
    private final TaskExecutor executor;
    private final Map<UUID, UUID> workers = new ConcurrentHashMap<>();

    public ChatCompletionService(CompletionTurnRepository turns, MessageRepository messages, MessageService messageService,
            ChatHistoryService history, CompletionService completions, ProjectService projects, UserService users,
            TemplateRepository templates, AiToolRegistry registry, SecurityUtils security, ObjectMapper mapper,
            TransactionTemplate tx, EntityManager entities, @Qualifier("taskExecutor") TaskExecutor executor) {
        this.turns = turns; this.messages = messages; this.messageService = messageService; this.history = history;
        this.completions = completions; this.projects = projects; this.users = users; this.templates = templates;
        this.registry = registry; this.security = security; this.mapper = mapper; this.tx = tx;
        this.entities = entities; this.executor = executor;
    }

    public ChatCompletionRun begin(Message input, Project project, CompletionRequestDTO request, BiConsumer<String, Object> events) {
        return tx.execute(status -> {
            if (input.getThreadId() != null) {
                ChatThread thread = entities.find(ChatThread.class, input.getThreadId(), LockModeType.PESSIMISTIC_WRITE);
                if (thread == null || !project.getId().equals(thread.getProjectId())) throw bad("INVALID_THREAD", "Thread is not in this project");
                if (!Boolean.TRUE.equals(thread.getPublicThread()) && !messagesAllowed(thread))
                    throw forbidden();
                turns.findFirstByThreadIdOrderByCreatedAtDesc(thread.getId()).ifPresent(t -> {
                    if (active(t)) throw bad("COMPLETION_ACTIVE", "This thread already has an active completion");
                });
            }
            Message saved = messageService.createMessage(input);
            Project loaded = loadProject(project.getId());
            List<AiTools> tools = tools(loaded);
            String token = UUID.randomUUID() + "." + UUID.randomUUID();
            CompletionTurn turn = new CompletionTurn();
            turn.setId(UUID.randomUUID()); turn.setThreadId(saved.getThreadId()); turn.setProjectId(project.getId());
            turn.setUserMessageId(saved.getId()); turn.setActorId(security.getUserId()); turn.setSessionHash(hash(token));
            turn.setStatus("GENERATING"); turn.setHistoryMessageIds(history.select(saved));
            turn.setClientToolResults(request.isClientToolResults()); turn.setOwnerId(UUID.randomUUID());
            turn.setConfigurationHash(configuration(loaded, tools)); turn.setCreatedAt(Instant.now()); turn.setHeartbeat(Instant.now());
            turns.saveAndFlush(turn);
            return new ChatCompletionRun(this, turn, loaded, tools, request.isStream(), token, events);
        });
    }

    private boolean messagesAllowed(ChatThread thread) {
        UUID actor = security.getUserId();
        return actor != null && thread.getChatThreadMembers().stream().anyMatch(m -> actor.equals(m.getUserId()));
    }

    /** Reconstruct only persisted IDs, never refresh search, local page context or the history window. */
    List<AiModelMessage> history(ChatCompletionRun run) {
        List<UUID> ids = new ArrayList<>(run.turn().getHistoryMessageIds());
        ids.add(run.turn().getUserMessageId()); ids.addAll(run.turn().getMessageIds());
        return history.build(ids, run.project());
    }

    public Message original(ChatCompletionRun run) {
        return tx.execute(s -> messages.findWithContextsByIds(List.of(run.turn().getUserMessageId())).getFirst());
    }

    public CompletionMessageDTO execute(ChatCompletionRun run) {
        workers.put(run.turn().getId(), run.turn().getOwnerId());
        try {
            run.emit("start", start(run));
            if (run.isStreaming()) for (UUID id : run.turn().getMessageIds())
                run.emit("message", Map.of("turnId", run.turn().getId(), "threadId", run.turn().getThreadId(),
                        "messageIndex", run.turn().getMessageIds().indexOf(id), "message", deliveryMessage(id)));
            Message input = original(run);
            if (run.turn().getIteration() < 5)
                completions.getCompletion(input, List.of(), run.project(), null, null, run);
            if (!"WAITING_FOR_TOOLS".equals(run.turn().getStatus())) {
                change(run, t -> t.setStatus("COMPLETED"));
            }
            CompletionMessageDTO result = response(run);
            if ("COMPLETED".equals(run.turn().getStatus())) run.emit("done", result);
            return result;
        } catch (Exception e) {
            if ("GENERATING".equals(run.turn().getStatus())) fail(run, "Completion failed; reload saved messages before retrying.");
            String error = run.turn().getError() == null ? "Completion failed; reload saved messages." : run.turn().getError();
            run.emit("error", Map.of("turnId", run.turn().getId(), "threadId", run.turn().getThreadId(), "message", error));
            LoggerFactory.getLogger(getClass()).error("Chat completion {} failed", run.turn().getId(), e);
            throw new GendoxRuntimeException(HttpStatus.BAD_GATEWAY, "CHAT_COMPLETION_FAILED", run.turn().getError(), e);
        } finally { workers.remove(run.turn().getId(), run.turn().getOwnerId()); }
    }

    public void executeAsync(ChatCompletionRun run) {
        executor.execute(new DelegatingSecurityContextRunnable(() -> {
            try { execute(run); } catch (Exception ignored) { /* Already recorded and delivered by execute. */ }
        }));
    }

    Message create(ChatCompletionRun run, Message message) {
        Message saved = tx.execute(s -> {
            Message created = messageService.createMessage(message);
            record(run, created);
            return created;
        });
        publish(run, saved);
        return saved;
    }

    private void record(ChatCompletionRun run, Message message) {
        change(run, t -> {
            var ids = new ArrayList<>(t.getMessageIds());
            ids.add(message.getId());
            t.setMessageIds(orderTools(ids));
            if ("assistant".equals(message.getRole())) t.setIteration(t.getIteration() + 1);
        });
    }

    private void publish(ChatCompletionRun run, Message message) {
        if ("assistant".equals(message.getRole())) attachSources(run, message);
        if ("advanced_search".equals(message.getName()) && "tool".equals(message.getRole())) {
            for (Message parent : messages.findAllById(run.turn().getMessageIds()))
                if (parent.getToolCalls() != null) for (JsonNode call : parent.getToolCalls())
                    if (call.path("id").asText().equals(message.getToolCallId())) attachSources(run, parent);
        }
        run.emit("message", Map.of("turnId", run.turn().getId(), "threadId", run.turn().getThreadId(),
                "messageIndex", run.turn().getMessageIds().indexOf(message.getId()), "message", deliveryMessage(message.getId())));
    }

    private Message deliveryMessage(UUID id) {
        return tx.execute(s -> {
            Message m = messages.findWithContextsByIds(List.of(id)).getFirst();
            messages.findWithSectionsByIds(List.of(id));
            return m;
        });
    }

    boolean defer(ChatCompletionRun run, Message assistant, JsonNode call, AiTools tool, boolean backend) {
        if (backend) return false;
        String execution = tool.getExecution() == null ? "ACTION" : tool.getExecution();
        boolean wait = run.turn().isClientToolResults() && execution.equals("CLIENT");
        if (wait) change(run, t -> {
            var pending = new ArrayList<>(t.getPendingCalls());
            pending.add(new CompletionTurn.PendingCall(call.path("id").asText(), assistant.getId(),
                    call.path("function").path("name").asText(), call.path("function").path("arguments").asText()));
            t.setPendingCalls(pending);
        });
        if (!wait) run.emit("tool_calls", Map.of("threadId", run.turn().getThreadId(), "turnId", run.turn().getId(),
                "messageId", assistant.getId(), "execution", "ACTION", "toolCalls", List.of(call)));
        return wait;
    }

    boolean waitForTools(ChatCompletionRun run) {
        if (run.turn().getPendingCalls().isEmpty()) return false;
        change(run, t -> { t.setStatus("WAITING_FOR_TOOLS"); t.setDeadline(Instant.now().plusSeconds(60)); });
        // State is committed before a fast host can submit its result.
        run.emit("waiting_for_tools", status(run.turn()));
        return true;
    }

    void warning(ChatCompletionRun run, String text) {
        Message message = new Message(); message.setRole("user"); message.setName("completion_limit_warning");
        message.setValue(text); message.setThreadId(run.turn().getThreadId()); message.setProjectId(run.turn().getProjectId());
        message.setCreatedBy(run.project().getProjectAgent().getUserId()); message.setUpdatedBy(message.getCreatedBy());
        create(run, message);
    }

    /** Null means a partial or duplicate reply; the caller returns current status without starting a worker. */
    public ChatCompletionRun reply(CompletionRequestDTO request, UUID projectId, String token, BiConsumer<String, Object> events) {
        if (request.getThreadId() == null || request.getToolCallId() == null || request.getValue() == null)
            throw bad("INVALID_TOOL_REPLY", "threadId, toolCallId and value are required");
        CompletionTurn latest = turns.findFirstByThreadIdOrderByCreatedAtDesc(request.getThreadId()).orElseThrow(ChatCompletionService::forbidden);
        var configurationError = new java.util.concurrent.atomic.AtomicReference<GendoxRuntimeException>();
        ChatCompletionRun resumed = tx.execute(s -> {
            CompletionTurn turn = turns.lock(latest.getId()).orElseThrow(ChatCompletionService::forbidden);
            authorize(turn, projectId, token);
            CompletionTurn.PendingCall call = turn.getPendingCalls().stream().filter(c -> c.id().equals(request.getToolCallId())).findFirst().orElse(null);
            Message existing = messages.findAllById(turn.getMessageIds()).stream()
                    .filter(m -> "tool".equals(m.getRole()) && request.getToolCallId().equals(m.getToolCallId())).findFirst().orElse(null);
            if (existing == null && call == null) existing = messages.findFirstByThreadIdAndRoleAndToolCallIdOrderByCreatedAtDesc(
                    request.getThreadId(), "tool", request.getToolCallId()).orElse(null);
            if (existing != null) {
                if (!request.getValue().equals(existing.getValue())) throw bad("TOOL_RESULT_CONFLICT", "A different result is already saved");
                return null;
            }
            if (!"WAITING_FOR_TOOLS".equals(turn.getStatus()) || call == null || !turn.getDeadline().isAfter(Instant.now()))
                throw bad("TOOL_REPLY_NOT_PENDING", "This tool call is not waiting for a result");
            Project project = loadProject(projectId);
            List<AiTools> tools = tools(project);
            if (!turn.getConfigurationHash().equals(configuration(project, tools))) {
                turn.setStatus("FAILED"); turn.setError("Agent configuration changed; start a new turn.");
                turns.saveAndFlush(turn);
                configurationError.set(bad("COMPLETION_CONFIGURATION_CHANGED", turn.getError()));
                return null;
            }
            saveResult(turn, call, request.getValue(), project);
            if (!allResults(turn)) { turns.save(turn); return null; }
            turn.setStatus("GENERATING"); turn.setOwnerId(UUID.randomUUID()); turn.setHeartbeat(Instant.now()); turn.setPendingCalls(new ArrayList<>());
            turns.saveAndFlush(turn);
            return new ChatCompletionRun(this, turn, project, tools, request.isStream(), null, events);
        });
        if (configurationError.get() != null) throw configurationError.get();
        return resumed;
    }

    private void saveResult(CompletionTurn turn, CompletionTurn.PendingCall call, String value, Project project) {
        Message result = new Message(); result.setRole("tool"); result.setName(call.name()); result.setToolCallId(call.id());
        result.setValue(value); result.setProjectId(turn.getProjectId()); result.setThreadId(turn.getThreadId());
        result.setCreatedBy(project.getProjectAgent().getUserId()); result.setUpdatedBy(result.getCreatedBy());
        result = messageService.createMessage(result);
        var ids = new ArrayList<>(turn.getMessageIds()); ids.add(result.getId()); turn.setMessageIds(orderTools(ids));
    }

    private boolean allResults(CompletionTurn turn) {
        Set<String> results = messages.findAllById(turn.getMessageIds()).stream().filter(m -> "tool".equals(m.getRole()))
                .map(Message::getToolCallId).collect(Collectors.toSet());
        return turn.getPendingCalls().stream().allMatch(c -> results.contains(c.id()));
    }

    private List<UUID> orderTools(List<UUID> ids) {
        Map<UUID, Message> rows = messages.findAllById(ids).stream().collect(Collectors.toMap(Message::getId, m -> m));
        Map<String, UUID> resultIds = new HashMap<>();
        rows.values().stream().filter(m -> "tool".equals(m.getRole())).forEach(m -> resultIds.put(m.getToolCallId(), m.getId()));
        List<UUID> ordered = new ArrayList<>();
        for (UUID id : ids) {
            Message m = rows.get(id);
            if ("tool".equals(m.getRole())) continue;
            ordered.add(id);
            if (m.getToolCalls() != null) for (JsonNode call : m.getToolCalls()) {
                UUID result = resultIds.get(call.path("id").asText());
                if (result != null) ordered.add(result);
            }
        }
        return ordered;
    }

    private void change(ChatCompletionRun run, Consumer<CompletionTurn> action) {
        run.turn(tx.execute(s -> {
            CompletionTurn locked = turns.lock(run.turn().getId()).orElseThrow();
            if (!Objects.equals(locked.getOwnerId(), run.turn().getOwnerId()) || !"GENERATING".equals(locked.getStatus()))
                throw bad("COMPLETION_OWNERSHIP_LOST", "Completion is no longer owned by this worker");
            action.accept(locked); locked.setHeartbeat(Instant.now()); return turns.saveAndFlush(locked);
        }));
    }

    private void fail(ChatCompletionRun run, String error) {
        CompletionTurn failed = tx.execute(s -> {
            CompletionTurn turn = turns.lock(run.turn().getId()).orElseThrow();
            if (!Objects.equals(turn.getOwnerId(), run.turn().getOwnerId()) || !"GENERATING".equals(turn.getStatus())) return null;
            closeUnansweredCalls(turn, run.project());
            turn.setStatus("FAILED"); turn.setError(error); turn.setPendingCalls(new ArrayList<>());
            return turns.saveAndFlush(turn);
        });
        if (failed != null) run.turn(failed);
    }

    private void closeUnansweredCalls(CompletionTurn turn, Project project) {
        List<Message> rows = messages.findAllById(turn.getMessageIds());
        Set<String> answered = rows.stream().filter(m -> "tool".equals(m.getRole())).map(Message::getToolCallId).collect(Collectors.toSet());
        for (Message assistant : rows) if (assistant.getToolCalls() != null) for (JsonNode call : assistant.getToolCalls()) {
            String id = call.path("id").asText();
            if (!id.isEmpty() && answered.add(id)) saveResult(turn, new CompletionTurn.PendingCall(id, assistant.getId(),
                    call.path("function").path("name").asText(), call.path("function").path("arguments").asText()),
                    "{\"error\":\"COMPLETION_INTERRUPTED\",\"message\":\"Execution outcome may be unknown; do not automatically repeat this action\"}", project);
        }
    }

    public Map<String, Object> status(UUID threadId, String token) {
        CompletionTurn turn = turns.findFirstByThreadIdOrderByCreatedAtDesc(threadId).orElse(null);
        if (turn == null) return Map.of("status", "IDLE");
        authorize(turn, turn.getProjectId(), token); return status(turn);
    }
    private Map<String, Object> status(CompletionTurn turn) {
        var result = new LinkedHashMap<String, Object>();
        result.put("turnId", turn.getId()); result.put("threadId", turn.getThreadId()); result.put("status", turn.getStatus());
        Set<String> answered = messages.findAllById(turn.getMessageIds()).stream().filter(m -> "tool".equals(m.getRole()))
                .map(Message::getToolCallId).collect(Collectors.toSet());
        result.put("pendingCalls", turn.getPendingCalls().stream().filter(call -> !answered.contains(call.id())).toList());
        result.put("deadline", turn.getDeadline()); result.put("error", turn.getError());
        return result;
    }
    private Map<String, Object> start(ChatCompletionRun run) {
        var result = new LinkedHashMap<String, Object>(); result.put("turnId", run.turn().getId());
        result.put("threadId", run.turn().getThreadId()); result.put("resumeToken", run.resumeToken());
        return result;
    }
    private void authorize(CompletionTurn turn, UUID projectId, String token) {
        if (!turn.getProjectId().equals(projectId)) throw forbidden();
        UUID actor = security.getUserId();
        if (turn.getActorId() != null && turn.getActorId().equals(actor)) return;
        if (turn.getActorId() == null && token != null && MessageDigest.isEqual(
                turn.getSessionHash().getBytes(StandardCharsets.UTF_8), hash(token).getBytes(StandardCharsets.UTF_8))) return;
        throw forbidden();
    }

    private Project loadProject(UUID id) {
        try {
            Project project = projects.getProjectById(id);
            project.getProjectAgent().getAiTools().size();
            project.getProjectAgent().getCompletionModel().getAiModelProvider().getName();
            project.getProjectAgent().getCompletionModel().getApiType().getName();
            return project;
        } catch (Exception e) { throw new IllegalStateException("Cannot load project", e); }
    }
    private List<AiTools> tools(Project project) {
        Map<String, AiTools> tools = new TreeMap<>();
        for (AiTools tool : project.getProjectAgent().getAiTools()) {
            try { tools.put(mapper.readTree(tool.getJsonSchema()).path("name").asText(), tool); }
            catch (Exception e) { throw bad("INVALID_TOOL_SCHEMA", "Tool schema is invalid"); }
        }
        JsonNode search = registry.getOpenAiToolDefinitions("advanced_search").get(0).get("function");
        tools.put("advanced_search", AiTools.builder().type("function").jsonSchema(search.toString()).build());
        return new ArrayList<>(tools.values());
    }
    private String configuration(Project project, List<AiTools> tools) {
        ProjectAgent a = project.getProjectAgent();
        String value = a.getAgentBehavior() + "|" + a.getCompletionModel().getId()
                + "|" + a.getCompletionModel().getModel() + "|" + a.getCompletionModel().getApiType().getName()
                + "|" + a.getCompletionModel().getSupportsReasoning() + "|" + a.getCompletionModel().getDefaultReasoningEffort()
                + "|" + a.getCompletionModel().getSupportsSamplingParams() + "|" + a.getCompletionModel().getSystemRoleName() + "|" + a.getMaxToken()
                + "|" + a.getTemperature() + "|" + a.getTopP() + "|" + a.getReasoningEffort()
                + "|" + templates.findByIdIs(a.getChatTemplateId()).getText()
                + "|" + tools.stream().map(t -> t.getExecution() + ":" + t.getJsonSchema()).collect(Collectors.joining("|"));
        return hash(value);
    }
    private static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private void attachSources(ChatCompletionRun run, Message assistant) {
        tx.execute(s -> { attachSourcesInTransaction(run, assistant); return null; });
    }
    private void attachSourcesInTransaction(ChatCompletionRun run, Message assistant) {
        Map<String, JsonNode> sections = searchSections(run.turn());
        Message stored = messages.findWithSectionsByIds(List.of(assistant.getId())).getFirst();
        var links = new ArrayList<>(stored.getMessageSections());
        Set<UUID> existing = links.stream().map(MessageSection::getSectionId).collect(Collectors.toSet());
        for (JsonNode section : sections.values()) {
            if (!section.hasNonNull("section_id") || !section.hasNonNull("document_id")) continue;
            if (existing.contains(UUID.fromString(section.get("section_id").asText()))) continue;
            MessageSection link = new MessageSection(); link.setMessage(assistant);
            link.setSectionId(UUID.fromString(section.get("section_id").asText()));
            link.setDocumentId(UUID.fromString(section.get("document_id").asText()));
            link.setCompletionParticipant(section.path("is_completion_participant").asBoolean(true));
            link.setSectionUrl(section.path("source").asText(null)); try { links.add(messageService.createMessageSection(link)); }
            catch (Exception e) { throw new IllegalStateException("Cannot associate search source", e); }
        }
        if (!links.isEmpty()) messageService.updateMessageWithSections(assistant, links);
    }
    private Map<String, JsonNode> searchSections(CompletionTurn turn) {
        var rows = messages.findAllById(turn.getMessageIds()).stream().collect(Collectors.toMap(Message::getId, m -> m));
        Map<String, JsonNode> sections = new LinkedHashMap<>();
        for (UUID id : turn.getMessageIds()) {
            Message message = rows.get(id);
            if (!"tool".equals(message.getRole()) || !"advanced_search".equals(message.getName())) continue;
            try {
                JsonNode result = mapper.readTree(message.getValue());
                for (String group : List.of("sections", "search_history")) for (JsonNode section : result.path(group)) {
                    String sectionId = section.path("section_id").asText();
                    JsonNode previous = sections.get(sectionId);
                    if (previous == null || section.path("is_completion_participant").asBoolean(true)) sections.put(sectionId, section);
                }
            }
            catch (Exception e) { throw new IllegalStateException("Saved search result is invalid", e); }
        }
        return sections;
    }
    private CompletionMessageDTO response(ChatCompletionRun run) {
        return tx.execute(s -> responseInTransaction(run));
    }
    private CompletionMessageDTO responseInTransaction(ChatCompletionRun run) {
        Map<UUID, Message> rows = messages.findWithContextsByIds(run.turn().getMessageIds()).stream().collect(Collectors.toMap(Message::getId, m -> m));
        if (!rows.isEmpty()) messages.findWithSectionsByIds(run.turn().getMessageIds());
        List<Message> ordered = run.turn().getMessageIds().stream().map(rows::get).toList();
        List<ProvenAiMetadata> metadata = searchSections(run.turn()).values().stream().filter(s -> s.hasNonNull("provenance"))
                .map(s -> mapper.convertValue(s.get("provenance"), ProvenAiMetadata.class)).toList();
        var builder = CompletionMessageDTO.builder().threadId(run.turn().getThreadId()).messages(ordered).provenAiMetadata(metadata);
        if ("WAITING_FOR_TOOLS".equals(run.turn().getStatus())) builder.status("WAITING_FOR_TOOLS").turnId(run.turn().getId()).resumeToken(run.resumeToken());
        return builder.build();
    }

    @Scheduled(fixedDelay = 5000)
    public void maintainTurns() {
        Instant now = Instant.now();
        workers.forEach((id, owner) -> tx.execute(s -> {
            turns.lock(id).ifPresent(t -> { if (owner.equals(t.getOwnerId()) && "GENERATING".equals(t.getStatus())) t.setHeartbeat(now); });
            return null;
        }));
        for (CompletionTurn candidate : turns.findByStatusAndHeartbeatBefore("GENERATING", now.minusSeconds(120))) {
            tx.execute(s -> { turns.lock(candidate.getId()).ifPresent(t -> {
                if ("GENERATING".equals(t.getStatus()) && t.getHeartbeat().isBefore(now.minusSeconds(120))) {
                    closeUnansweredCalls(t, loadProject(t.getProjectId()));
                    t.setPendingCalls(new ArrayList<>());
                    t.setStatus("FAILED"); t.setError("Generation was interrupted. Saved messages are available.");
                }
            }); return null; });
        }
        for (CompletionTurn candidate : turns.findByStatusAndDeadlineBefore("WAITING_FOR_TOOLS", now)) {
            try {
                ChatCompletionRun run = tx.execute(s -> {
                    CompletionTurn t = turns.lock(candidate.getId()).orElseThrow();
                    if (!"WAITING_FOR_TOOLS".equals(t.getStatus()) || t.getDeadline().isAfter(now)) return null;
                    Project project = loadProject(t.getProjectId()); List<AiTools> tools = tools(project);
                    if (!t.getConfigurationHash().equals(configuration(project, tools))) {
                        t.setStatus("FAILED"); t.setError("Agent configuration changed while waiting for tools."); return null;
                    }
                    Set<String> answered = messages.findAllById(t.getMessageIds()).stream().map(Message::getToolCallId).collect(Collectors.toSet());
                    for (CompletionTurn.PendingCall call : t.getPendingCalls()) if (!answered.contains(call.id()))
                        saveResult(t, call, "{\"error\":\"CLIENT_TOOL_TIMEOUT\",\"message\":\"Host did not return a result within 60 seconds\"}", project);
                    t.setPendingCalls(new ArrayList<>()); t.setStatus("GENERATING"); t.setOwnerId(UUID.randomUUID()); t.setHeartbeat(now);
                    turns.saveAndFlush(t);
                    return new ChatCompletionRun(this, t, project, tools, false, null, (event, data) -> {});
                });
                if (run != null) {
                    var context = SecurityContextHolder.createEmptyContext();
                    if (run.turn().getActorId() != null) context.setAuthentication(new GendoxAuthenticationToken(
                            users.getUserProfileByUniqueIdentifier(run.turn().getActorId().toString()), null, List.of()));
                    else context.setAuthentication(new AnonymousAuthenticationToken("chat-timeout", "anonymousUser", List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
                    executor.execute(new DelegatingSecurityContextRunnable(() -> { try { execute(run); } catch (Exception ignored) {} }, context));
                }
            } catch (Exception e) { LoggerFactory.getLogger(getClass()).error("Cannot expire client tools for {}", candidate.getId(), e); }
        }
    }
    private static boolean active(CompletionTurn t) { return Set.of("GENERATING", "WAITING_FOR_TOOLS").contains(t.getStatus()); }
    private static GendoxRuntimeException bad(String code, String message) { return new GendoxRuntimeException(HttpStatus.CONFLICT, code, message); }
    private static GendoxRuntimeException forbidden() { return new GendoxRuntimeException(HttpStatus.FORBIDDEN, "FORBIDDEN_COMPLETION", "Completion is not available to this session"); }
}

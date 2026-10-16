package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.*;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents.ChatTemplateAuthor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatHistoryService {
    private final MessageRepository messages;
    private final CompletionTurnRepository turns;
    private final MessageAiMessageConverter converter;
    private final MessageLocalContextService localContexts;
    private final TemplateRepository templates;

    public ChatHistoryService(MessageRepository messages, CompletionTurnRepository turns,
            MessageAiMessageConverter converter, MessageLocalContextService localContexts, TemplateRepository templates) {
        this.messages = messages; this.turns = turns; this.converter = converter;
        this.localContexts = localContexts; this.templates = templates;
    }

    @Transactional(readOnly = true)
    public List<UUID> select(Message current) {
        var ids = new ArrayList<>(messages.findHistoryIds(current.getThreadId(), current.getCreatedAt(), current.getId()));
        // Persisted turn order resolves timestamp ties and parallel tool results.
        for (CompletionTurn turn : turns.findByThreadIdOrderByCreatedAtAsc(current.getThreadId())) {
            var ordered = new ArrayList<UUID>();
            ordered.add(turn.getUserMessageId()); ordered.addAll(turn.getMessageIds());
            var present = ordered.stream().filter(ids::contains).toList();
            if (present.isEmpty()) continue;
            int first = ids.indexOf(present.getFirst());
            for (UUID id : present) first = Math.min(first, ids.indexOf(id));
            ids.removeAll(present); ids.addAll(first, present);
        }
        int count = Math.min(ids.size(), 25 + ids.size() % 25);
        ids = new ArrayList<>(ids.subList(ids.size() - count, ids.size()));
        Map<UUID, Message> rows = load(ids);
        while (!ids.isEmpty()) {
            Message first = rows.get(ids.getFirst());
            if ("user".equals(first.getRole()) && !"completion_limit_warning".equals(first.getName())) break;
            ids.removeFirst();
        }
        return ids;
    }

    @Transactional(readOnly = true)
    public List<AiModelMessage> build(List<UUID> ids, Project project) {
        Map<UUID, Message> rows = load(ids);
        String template = templates.findByIdIs(project.getProjectAgent().getChatTemplateId()).getText();
        List<AiModelMessage> result = new ArrayList<>();
        for (UUID id : ids) {
            Message row = rows.get(id);
            if (row == null) throw new IllegalStateException("A message required to continue this turn is unavailable");
            row.getLocalContexts().sort(Comparator.comparing(MessageLocalContext::getId));
            row.setAdditionalResources(localContexts.getImageContentPartsFromLocalContext(row, true));
            AiModelMessage model;
            try { model = converter.toDTO(row); }
            catch (Exception e) { throw new IllegalStateException("Cannot reconstruct message", e); }
            if ("user".equals(row.getRole()) && !"completion_limit_warning".equals(row.getName()))
                model.setContent(new ChatTemplateAuthor().chatTemplate(row, "", template));
            // JSONB may change object-key order; canonicalize both live and restored tool definitions.
            model.setToolCalls(canonical(model.getToolCalls()));
            model.setReasoningMetadata(canonical(model.getReasoningMetadata()));
            result.add(model);
        }
        return result;
    }

    private Map<UUID, Message> load(List<UUID> ids) {
        if (ids.isEmpty()) return Map.of();
        return messages.findWithContextsByIds(ids).stream().collect(Collectors.toMap(Message::getId, m -> m));
    }

    public static JsonNode canonical(JsonNode node) {
        if (node == null) return null;
        if (node.isObject()) {
            ObjectNode sorted = JsonNodeFactory.instance.objectNode();
            var keys = new TreeSet<String>(); node.fieldNames().forEachRemaining(keys::add);
            keys.forEach(k -> sorted.set(k, canonical(node.get(k)))); return sorted;
        }
        if (node.isArray()) {
            ArrayNode array = JsonNodeFactory.instance.arrayNode(); node.forEach(n -> array.add(canonical(n))); return array;
        }
        return node.deepCopy();
    }
}

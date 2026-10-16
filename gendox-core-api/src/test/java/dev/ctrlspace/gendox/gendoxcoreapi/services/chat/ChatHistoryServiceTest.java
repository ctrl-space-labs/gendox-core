package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.*;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import org.junit.jupiter.api.*;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatHistoryServiceTest {
    final MessageRepository messages = mock(MessageRepository.class);
    final CompletionTurnRepository turns = mock(CompletionTurnRepository.class);
    final MessageLocalContextService contexts = mock(MessageLocalContextService.class);
    final TemplateRepository templates = mock(TemplateRepository.class);
    final ObjectMapper mapper = new ObjectMapper();
    final Map<UUID, Message> database = new HashMap<>();
    final ChatHistoryService service = new ChatHistoryService(messages, turns, new MessageAiMessageConverter(), contexts, templates);
    final Project project = new Project();
    @BeforeEach void setup() {
        ProjectAgent agent = new ProjectAgent(); agent.setChatTemplateId(UUID.randomUUID()); project.setProjectAgent(agent);
        Template template = new Template(); template.setText("${localContexts}\n${question}\n${context}");
        when(templates.findByIdIs(any())).thenReturn(template);
        when(messages.findWithContextsByIds(anyList())).thenAnswer(i -> {
            List<UUID> ids = i.getArgument(0); return ids.reversed().stream().map(database::get).toList();
        });
        when(contexts.getImageContentPartsFromLocalContext(any(), eq(true))).thenReturn(List.of());
    }
    @Test void dbReloadKeepsSameCachePrefixIncludingLocalContextImagesToolsAndSignatures() throws Exception {
        Message user = row("user", "question");
        MessageLocalContext second = new MessageLocalContext(); second.setId(new UUID(0,2)); second.setValue("B <value>"); second.setContextTypeName("page");
        MessageLocalContext first = new MessageLocalContext(); first.setId(new UUID(0,1)); first.setValue("A"); first.setContextTypeName("selection");
        user.setLocalContexts(new ArrayList<>(List.of(second, first)));
        var image = ContentPart.builder().type("image_url").imageUrl(ContentPart.ImageInput.builder().url("data:image/png;base64,AAAA").build()).build();
        when(contexts.getImageContentPartsFromLocalContext(eq(user), eq(true))).thenReturn(List.of(image));
        Message assistant = row("assistant", null); assistant.setAiModelId(UUID.randomUUID());
        assistant.setToolCalls(mapper.readTree("[{\"type\":\"function\",\"id\":\"a\",\"function\":{\"name\":\"advanced_search\",\"arguments\":\"{ \\\"q\\\": 1 }\"}}]"));
        assistant.setReasoningContent("summary"); assistant.setReasoningMetadata(mapper.readTree("{\"signature\":\"opaque\",\"text\":\"summary\"}"));
        Message rag = row("tool", "{ \"sections\": [{\"section_text\":\"original document text\"}] }"); rag.setToolCallId("a"); rag.setName("advanced_search");
        List<UUID> ids = List.of(user.getId(), assistant.getId(), rag.getId());
        var uninterrupted = service.build(ids, project);
        // Model database JSONB reordering and collection reload order; text columns remain verbatim.
        assistant.setToolCalls(ChatHistoryService.canonical(assistant.getToolCalls()));
        assistant.setReasoningMetadata(ChatHistoryService.canonical(assistant.getReasoningMetadata()));
        user.setLocalContexts(new ArrayList<>(List.of(second, first)));
        var restored = service.build(ids, project);
        assertEquals(mapper.writeValueAsString(uninterrupted), mapper.writeValueAsString(restored));
        assertEquals(uninterrupted.get(1).getReasoningMetadata(), restored.get(1).getReasoningMetadata());
        assertEquals(assistant.getAiModelId(), restored.get(1).getAiModelId());
        assertEquals(rag.getValue(), restored.get(2).getContent());
        assertTrue(restored.getFirst().getContent().contains("B &lt;value&gt;"));
        assertEquals(List.of(image), restored.getFirst().getContentParts());
    }
    @Test void selectedHistoryUsesRecordedTurnOrderForTiedTimestampsAndParallelReplies() {
        Message user = row("user", "first"); Message assistant = row("assistant", "tools");
        Message resultA = row("tool", "a"); Message resultB = row("tool", "b"); Message next = row("user", "next");
        var turn = new CompletionTurn(); turn.setUserMessageId(user.getId());
        turn.setMessageIds(List.of(assistant.getId(), resultA.getId(), resultB.getId()));
        when(turns.findByThreadIdOrderByCreatedAtAsc(any())).thenReturn(List.of(turn));
        when(messages.findHistoryIds(any(), any(), any())).thenReturn(List.of(resultB.getId(), resultA.getId(), assistant.getId(), user.getId()));
        assertEquals(List.of(user.getId(), assistant.getId(), resultA.getId(), resultB.getId()), service.select(next));
    }
    @Test void existingWindowPolicyStartsAtUserBoundary() {
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < 60; i++) ids.add(row(i % 3 == 0 ? "user" : "assistant", "m" + i).getId());
        when(messages.findHistoryIds(any(), any(), any())).thenReturn(ids);
        when(turns.findByThreadIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        var selected = service.select(row("user", "new"));
        assertTrue(selected.size() <= 35);
        assertEquals("user", database.get(selected.getFirst()).getRole());
    }
    private Message row(String role, String value) {
        Message message = new Message(); message.setId(UUID.randomUUID()); message.setThreadId(UUID.randomUUID());
        message.setRole(role); message.setValue(value); message.setCreatedAt(Instant.parse("2026-10-16T10:00:00Z"));
        database.put(message.getId(), message); return message;
    }
}

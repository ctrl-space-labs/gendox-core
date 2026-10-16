package dev.ctrlspace.gendox.gendoxcoreapi.services.chat;

import com.fasterxml.jackson.databind.*;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import java.sql.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@EnabledIfEnvironmentVariable(named = "GENDOX_TEST_JDBC_URL", matches = ".+")
class ChatHistoryPostgresTest {
    @Test void databaseReloadPreservesCacheSensitiveInputWithoutSnapshots() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        try (Connection db = DriverManager.getConnection(System.getenv("GENDOX_TEST_JDBC_URL"), "postgres", "")) {
            db.createStatement().execute("CREATE SCHEMA IF NOT EXISTS chat_history_test");
            db.createStatement().execute("CREATE TABLE IF NOT EXISTS chat_history_test.message(id uuid PRIMARY KEY, role text, value text, tool_call_id text, tool_calls jsonb, reasoning_metadata jsonb, ai_model_id uuid)");
            db.createStatement().execute("CREATE TABLE IF NOT EXISTS chat_history_test.local_context(id uuid PRIMARY KEY, message_id uuid, value text)");
            UUID user = UUID.randomUUID(), assistant = UUID.randomUUID(), result = UUID.randomUUID(), model = UUID.randomUUID();
            String arguments = "{ \"query\": \"hello\" }";
            var calls = mapper.createArrayNode(); calls.addObject().put("type", "function").put("id", "call").putObject("function").put("name", "advanced_search").put("arguments", arguments);
            String searchResult = "{ \"sections\": [{\"section_text\":\"Original document\"}] }";
            try (PreparedStatement insert = db.prepareStatement("INSERT INTO chat_history_test.message VALUES (?, ?, ?, ?, ?::jsonb, ?::jsonb, ?)")) {
                Object[][] values = {{user,"user","question",null,null,null,null},{assistant,"assistant",null,null,calls.toString(),"{\"signature\":\"opaque\",\"text\":\"reason\"}",model},{result,"tool",searchResult,"call",null,null,null}};
                for (Object[] row : values) { for (int i = 0; i < row.length; i++) insert.setObject(i + 1, row[i]); insert.executeUpdate(); }
            }
            try (PreparedStatement insert = db.prepareStatement("INSERT INTO chat_history_test.local_context VALUES (?, ?, ?)")) {
                insert.setObject(1, UUID.randomUUID()); insert.setObject(2, user); insert.setString(3, "saved page context"); insert.executeUpdate();
            }
            MessageRepository messages = mock(MessageRepository.class);
            when(messages.findWithContextsByIds(anyList())).thenAnswer(invocation -> {
                List<Message> rows = new ArrayList<>();
                for (UUID id : (List<UUID>)invocation.getArgument(0)) {
                    try (PreparedStatement query = db.prepareStatement("SELECT * FROM chat_history_test.message WHERE id = ?")) {
                        query.setObject(1,id); ResultSet row = query.executeQuery(); row.next();
                        Message message = new Message(); message.setId(id); message.setRole(row.getString("role")); message.setValue(row.getString("value"));
                        message.setToolCallId(row.getString("tool_call_id")); message.setAiModelId(row.getObject("ai_model_id", UUID.class));
                        if (row.getString("tool_calls") != null) message.setToolCalls(mapper.readTree(row.getString("tool_calls")));
                        if (row.getString("reasoning_metadata") != null) message.setReasoningMetadata(mapper.readTree(row.getString("reasoning_metadata")));
                        try (PreparedStatement contextQuery = db.prepareStatement("SELECT * FROM chat_history_test.local_context WHERE message_id = ?")) {
                            contextQuery.setObject(1, id); ResultSet contexts = contextQuery.executeQuery();
                            while (contexts.next()) { MessageLocalContext context = new MessageLocalContext(); context.setId(contexts.getObject("id", UUID.class)); context.setContextTypeName("page"); context.setValue(contexts.getString("value")); message.getLocalContexts().add(context); }
                        }
                        rows.add(message);
                    }
                }
                return rows;
            });
            TemplateRepository templates = mock(TemplateRepository.class); Template template = new Template(); template.setText("${question}\n${localContexts}"); when(templates.findByIdIs(any())).thenReturn(template);
            MessageLocalContextService contexts = mock(MessageLocalContextService.class); when(contexts.getImageContentPartsFromLocalContext(any(), eq(true))).thenReturn(List.of());
            var history = new ChatHistoryService(messages, mock(CompletionTurnRepository.class), new MessageAiMessageConverter(), contexts, templates);
            Project project = new Project(); ProjectAgent agent = new ProjectAgent(); agent.setChatTemplateId(UUID.randomUUID()); project.setProjectAgent(agent);
            var before = history.build(List.of(user,assistant), project);
            var after = history.build(List.of(user,assistant,result), project);
            assertEquals(mapper.writeValueAsString(before), mapper.writeValueAsString(after.subList(0,2)));
            assertEquals(arguments, after.get(1).getToolCalls().get(0).path("function").path("arguments").asText());
            assertEquals(searchResult, after.get(2).getContent());
            assertEquals(model, after.get(1).getAiModelId());
            assertEquals("opaque", after.get(1).getReasoningMetadata().path("signature").asText());
            assertTrue(after.get(0).getContent().contains("saved page context"));
            db.createStatement().execute("DROP SCHEMA chat_history_test CASCADE");
        }
    }
}

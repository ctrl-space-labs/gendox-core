package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** A model that never stops calling tools gets the configured number of rounds, then the loop stops. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompletionServiceToolLimitTest {

    @Mock private AiModelService aiModelService;
    @Mock private AiModelUtils aiModelUtils;
    @Mock private AiModelApiAdapterService adapter;
    @Mock private TypeService typeService;
    @Mock private AuditLogsService auditLogsService;
    @Mock private MessageService messageService;
    @Mock private MessageAiMessageConverter messageAiMessageConverter;
    @Mock private AiToolRegistry aiToolRegistry;

    private CompletionService completionService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final List<String> toolChoices = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        completionService = new CompletionService(null, null, messageAiMessageConverter, null, null, null, typeService,
                aiModelUtils, null, null, null, messageService, auditLogsService, null, objectMapper, aiModelService,
                aiToolRegistry, new SkillService(null, null, null, null, null));

        Type apiType = new Type();
        apiType.setName("TEST_API");
        AiModel model = new AiModel();
        model.setApiType(apiType);
        when(aiModelService.getByName("test-model")).thenReturn(model);
        when(aiModelUtils.getAiModelApiAdapterImpl("TEST_API")).thenReturn(adapter);
        when(auditLogsService.createDefaultAuditLogs(any())).thenAnswer(inv -> new AuditLogs());
        when(messageService.createMessage(any())).thenAnswer(inv -> inv.getArgument(0));
        when(messageService.getPreviousMessages(any(), anyInt())).thenAnswer(inv -> new ArrayList<>());
        when(aiToolRegistry.execute(any(), any(), any())).thenReturn(objectMapper.createObjectNode().put("ok", true));
        when(messageAiMessageConverter.toEntity(any(AiModelMessage.class))).thenAnswer(inv -> {
            AiModelMessage source = inv.getArgument(0);
            Message message = new Message();
            message.setRole(source.getRole());
            message.setValue(source.getContent());
            message.setToolCalls(source.getToolCalls());
            message.setToolCallId(source.getToolCallId());
            return message;
        });

        // a model that never stops calling tools
        when(adapter.askCompletion(any(), any(), any(), any(), any(), any(), any(), any(), any())).thenAnswer(inv -> {
            toolChoices.add(inv.getArgument(6));
            AiModelMessage reply = new AiModelMessage();
            reply.setRole("assistant");
            reply.setToolCalls(objectMapper.readTree("""
                    [{"id":"call-%d","type":"function","function":{"name":"list_tasks","arguments":"{}"}}]
                    """.formatted(toolChoices.size())));
            return CompletionResponse.builder()
                    .choices(List.of(Choice.builder().message(reply).finishReason("tool_calls").build()))
                    .usage(Usage.builder().promptTokens(1).completionTokens(1).build())
                    .build();
        });
    }

    private List<Message> run() throws Exception {
        Message prompt = new Message();
        prompt.setRole("user");
        prompt.setValue("Do a lot of things");

        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .systemPrompt("You are a test.")
                .completionModelName("test-model")
                .completionApiKey("test-key")
                .maxTokens(100L)
                .temperature(0.0)
                .topP(1.0)
                .projectId(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .createdByAgentUserId(UUID.randomUUID())
                .aiTools(List.of(AiTools.builder().type("function").jsonSchema("{\"name\":\"list_tasks\",\"parameters\":{}}").build()))
                .build();
        return completionService.getCompletion(prompt, List.of(), null, null, overrides);
    }

    @Test
    void aCompletionGetsTheConfiguredNumberOfRounds() throws Exception {
        ReflectionTestUtils.setField(completionService, "maxToolIterations", 7);

        List<Message> messages = run();

        assertEquals(7, toolChoices.size());
        assertTrue(toolChoices.stream().allMatch("auto"::equals));
        assertEquals("tool", messages.getLast().getRole());
    }
}

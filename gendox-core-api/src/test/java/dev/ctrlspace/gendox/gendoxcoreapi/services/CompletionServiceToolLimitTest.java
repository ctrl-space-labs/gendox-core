package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import tools.jackson.databind.json.JsonMapper;

import tools.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.ToolsHandlerAdvice;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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

/**
 * A model gets the configured number of tool rounds, followed by a request for the answer.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompletionServiceToolLimitTest {

    @Mock
    private AiModelService aiModelService;
    @Mock
    private AiModelUtils aiModelUtils;
    @Mock
    private AiModelApiAdapterService adapter;
    @Mock
    private TypeService typeService;
    @Mock
    private AuditLogsService auditLogsService;
    @Mock
    private MessageService messageService;
    @Mock
    private MessageAiMessageConverter messageAiMessageConverter;
    @Mock
    private AiToolRegistry aiToolRegistry;

    private CompletionService completionService;
    private final ObjectMapper objectMapper = JsonMapper.shared();
    private final List<String> toolChoices = new ArrayList<>();
    /** The messages of each request to the model. */
    private final List<List<AiModelMessage>> requests = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        CompletionRuntimeContextResolver contextResolver = new CompletionRuntimeContextResolver(null, typeService, null, null,
                objectMapper, aiModelService, aiToolRegistry, new SkillService(null, null, null, null, null, null), null, null,
                mock(ArtifactService.class));
        completionService = new CompletionService(null, null, messageAiMessageConverter, null, typeService,
                aiModelUtils, null, null, null, messageService, auditLogsService, objectMapper,
                aiToolRegistry, contextResolver, new ToolExecutionService(aiToolRegistry, objectMapper, new ToolsHandlerAdvice()));

        Type apiType = new Type();
        apiType.setName("TEST_API");
        AiModel model = new AiModel();
        model.setApiType(apiType);
        when(aiModelService.getByName(org.mockito.ArgumentMatchers.eq("test-model"), org.mockito.ArgumentMatchers.any())).thenReturn(model);
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
            requests.add(List.copyOf(inv.<List<AiModelMessage>>getArgument(0)));
            AiModelMessage reply = new AiModelMessage();
            reply.setRole("assistant");
            boolean answerOnly = "none".equals(inv.<String>getArgument(6));
            if (answerOnly) {
                reply.setContent("Answer after tools");
            } else {
                reply.setToolCalls(objectMapper.readTree("""
                        [{"id":"call-%d","type":"function","function":{"name":"list_tasks","arguments":"{}"}}]
                        """.formatted(toolChoices.size())));
            }
            return CompletionResponse.builder()
                    .choices(List.of(Choice.builder().message(reply).finishReason(answerOnly ? "stop" : "tool_calls").build()))
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

        assertEquals(8, toolChoices.size());
        assertTrue(toolChoices.subList(0, 7).stream().allMatch("auto"::equals));
        assertEquals("none", toolChoices.getLast());
        assertEquals("tool", requests.getLast().reversed().get(1).getRole());
        assertEquals("Answer after tools", messages.getLast().getValue());
    }

    @Test
    void anImageAToolShowsFollowsItsResultAsAUserImageAndIsNotSaved() throws Exception {
        ReflectionTestUtils.setField(completionService, "maxToolIterations", 3);
        when(aiToolRegistry.supports(any())).thenReturn(true);
        ContentPart page = ContentPart.builder().type("image_url")
                .imageUrl(ContentPart.ImageInput.builder().url("data:image/jpeg;base64,AAAA").build()).build();
        when(aiToolRegistry.execute(any(), any(), any())).thenAnswer(inv -> {
            inv.<ToolExecutionContext>getArgument(2).images().add(page);
            return objectMapper.createObjectNode().put("status", "shown");
        });

        List<Message> saved = run();

        List<AiModelMessage> second = requests.get(1);
        assertEquals(List.of("tool", "user"), second.subList(second.size() - 2, second.size()).stream().map(AiModelMessage::getRole).toList());
        assertEquals(List.of(page), second.getLast().getContentParts());
        assertTrue(saved.stream().noneMatch(message -> "user".equals(message.getRole())));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2})
    void aToolCallCutByTheOutputLimitIsAnsweredWithAnErrorAndNotRun(int maxToolIterations) throws Exception {
        ReflectionTestUtils.setField(completionService, "maxToolIterations", maxToolIterations);
        // first answer: the output limit ends it inside a tool call; second: a plain answer
        List<String> finishReasons = new ArrayList<>(List.of("length", "stop"));
        // doAnswer, not when(): when() would call the answer of setUp, with no arguments
        doAnswer(inv -> {
            toolChoices.add(inv.getArgument(6));
            requests.add(List.copyOf(inv.<List<AiModelMessage>>getArgument(0)));
            String finishReason = finishReasons.removeFirst();
            AiModelMessage reply = new AiModelMessage();
            reply.setRole("assistant");
            if ("length".equals(finishReason)) {
                reply.setToolCalls(objectMapper.readTree("""
                        [{"id":"call-1","type":"function","function":{"name":"list_tasks","arguments":"{\\"name_con"}}]
                        """));
            } else {
                reply.setContent("Here it is, smaller.");
            }
            return CompletionResponse.builder()
                    .choices(List.of(Choice.builder().message(reply).finishReason(finishReason).build()))
                    .usage(Usage.builder().promptTokens(1).completionTokens(1).build())
                    .build();
        }).when(adapter).askCompletion(any(), any(), any(), any(), any(), any(), any(), any(), any());

        List<Message> messages = run();

        assertEquals(List.of("assistant", "tool", "assistant"), messages.stream().map(Message::getRole).toList());
        Message cutShort = messages.get(1);
        assertEquals("call-1", cutShort.getToolCallId());
        assertTrue(cutShort.getValue().contains("TOOL_CALL_CUT_SHORT"));
        assertEquals(List.of("auto", maxToolIterations == 1 ? "none" : "auto"), toolChoices);
        assertTrue(requests.getLast().stream()
                .anyMatch(message -> "tool".equals(message.getRole()) && "call-1".equals(message.getToolCallId())));
        assertEquals("Here it is, smaller.", messages.getLast().getValue());
        verify(aiToolRegistry, never()).execute(any(), any(), any());
    }
}

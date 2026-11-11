package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.ToolsHandlerAdvice;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn.PendingCall;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ToolExecutionService.ToolRound;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Where a tool call runs: in Gendox, on the client while the turn waits, on the client as an action, or not at all. */
class ToolExecutionServiceTest {

    final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
    final AiToolRegistry aiToolRegistry = mock(AiToolRegistry.class);
    final ToolExecutionService service = new ToolExecutionService(aiToolRegistry, mapper, new ToolsHandlerAdvice());

    final Project project = new Project();
    final ProjectAgent agent = new ProjectAgent();
    final CancellationToken token = new CancellationToken(() -> false);
    final List<AiModelMessage> history = new ArrayList<>();
    final List<JsonNode> toldToTheClient = new ArrayList<>();
    final CompletionListener listener = new CompletionListener(true) {
        @Override
        public void onClientToolCalls(Message assistant, List<JsonNode> toolCalls) {
            toldToTheClient.addAll(toolCalls);
        }
    };

    private static AiTools tool(String name, String execution) {
        return AiTools.builder().type("function").execution(execution).jsonSchema("{\"name\":\"" + name + "\"}").build();
    }

    private CompletionRuntimeContext offering(AiTools... tools) {
        return new CompletionRuntimeContext(project, agent, "Question", "Be helpful", null, null, null, List.of(tools),
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), token);
    }

    private Message assistantCalling(String... names) {
        Message assistant = new Message();
        assistant.setId(UUID.randomUUID());
        assistant.setRole("assistant");
        var calls = mapper.createArrayNode();
        for (String name : names) {
            ObjectNode call = calls.addObject().put("id", "call-" + name).put("type", "function");
            call.putObject("function").put("name", name).put("arguments", "{\"q\":\"" + name + "\"}");
        }
        assistant.setToolCalls(calls);
        return assistant;
    }

    @Test
    void aToolWithAHandlerRunsInGendox() throws Exception {
        AiTools lookup = tool("lookup", "ACTION");
        Message assistant = assistantCalling("lookup");
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"found\":3}"));

        ToolRound round = service.run(assistant, history, offering(lookup), listener, true);

        assertTrue(round.pending().isEmpty());
        AiModelMessage result = round.results().getFirst();
        assertEquals("tool", result.getRole());
        assertEquals("call-lookup", result.getToolCallId());
        assertEquals("lookup", result.getName());
        assertEquals("{\"found\":3}", result.getContent());
        assertTrue(toldToTheClient.isEmpty());

        ArgumentCaptor<JsonNode> arguments = ArgumentCaptor.forClass(JsonNode.class);
        ArgumentCaptor<ToolExecutionContext> context = ArgumentCaptor.forClass(ToolExecutionContext.class);
        verify(aiToolRegistry).execute(eq("lookup"), arguments.capture(), context.capture());
        assertEquals("{\"q\":\"lookup\"}", arguments.getValue().asText());
        assertEquals(new ToolExecutionContext(project, agent, assistant, history, lookup, token), context.getValue());
    }

    @Test
    void aClientToolTheClientAnswersIsLeftPending() {
        Message assistant = assistantCalling("pick_file");

        ToolRound round = service.run(assistant, history, offering(tool("pick_file", "CLIENT")), listener, true);

        assertTrue(round.results().isEmpty());
        assertEquals(List.of(new PendingCall("call-pick_file", assistant.getId(), "pick_file", "{\"q\":\"pick_file\"}")), round.pending());
        assertTrue(toldToTheClient.isEmpty());
        verify(aiToolRegistry, never()).execute(any(), any(), any());
    }

    @Test
    void aClientToolNobodyWaitsForIsToldItRan() {
        Message assistant = assistantCalling("pick_file");

        ToolRound round = service.run(assistant, history, offering(tool("pick_file", "CLIENT")), listener, false);

        assertTrue(round.pending().isEmpty());
        assertEquals("{\"status\":\"executed\"}", round.results().getFirst().getContent());
        assertEquals(1, toldToTheClient.size());
        verify(aiToolRegistry, never()).execute(any(), any(), any());
    }

    @Test
    void anActionOfThePageIsToldItRanAndThePageHearsOfIt() throws Exception {
        Message assistant = assistantCalling("lookup", "open_page", "pick_file");
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"found\":3}"));

        ToolRound round = service.run(assistant, history,
                offering(tool("lookup", "ACTION"), tool("open_page", "ACTION"), tool("pick_file", "CLIENT")), listener, true);

        // results in the order of the calls; the CLIENT call waits
        assertEquals(List.of("call-lookup", "call-open_page"), round.results().stream().map(AiModelMessage::getToolCallId).toList());
        assertEquals(List.of("{\"found\":3}", "{\"status\":\"executed\"}"), round.results().stream().map(AiModelMessage::getContent).toList());
        assertEquals(List.of("pick_file"), round.pending().stream().map(PendingCall::name).toList());
        assertEquals(List.of("call-open_page"), toldToTheClient.stream().map(call -> call.get("id").asText()).toList());
    }

    @Test
    void aToolThatIsNotOfferedDoesNotRunEvenWhenGendoxHasAHandlerForIt() throws Exception {
        Message assistant = assistantCalling("run_task", "lookup");
        when(aiToolRegistry.supports(anyString())).thenReturn(true);
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"found\":3}"));

        ToolRound round = service.run(assistant, history, offering(tool("lookup", "ACTION"), tool("count", "ACTION")), listener, true);

        // an error result for the call that is not offered, and the other call still runs
        assertEquals(List.of("call-run_task", "call-lookup"), round.results().stream().map(AiModelMessage::getToolCallId).toList());
        AiModelMessage refused = round.results().getFirst();
        assertEquals("tool", refused.getRole());
        assertEquals("run_task", refused.getName());
        JsonNode error = mapper.readTree(refused.getContent());
        assertEquals("AI_TOOL_NOT_FOUND", error.get("errorCode").asText());
        assertEquals("Tool run_task is not available. Available tools: count, lookup", error.get("errorMessage").asText());
        assertEquals("run_task", error.get("metadata").get("tool").asText());
        assertTrue(round.pending().isEmpty());
        assertTrue(toldToTheClient.isEmpty());
        verify(aiToolRegistry, never()).execute(eq("run_task"), any(), any());
    }

    @Test
    void aCallWhenNoToolIsOfferedIsRefusedToo() throws Exception {
        ToolRound round = service.run(assistantCalling("lookup"), history, offering(), listener, true);

        JsonNode error = mapper.readTree(round.results().getFirst().getContent());
        assertEquals("Tool lookup is not available. No tools are available.", error.get("errorMessage").asText());
    }
}

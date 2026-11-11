package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** The chat path of CompletionService: search mode, the answer's sources, and turns that wait for client tools. */
class CompletionServiceChatTest extends CompletionServiceFixture {

    private Message saved(String role, String name, String value) {
        Message message = new Message();
        message.setId(UUID.randomUUID());
        message.setRole(role);
        message.setName(name);
        message.setValue(value);
        return message;
    }

    @Test
    void alwaysIsTheDefault() throws Exception {
        respondWithToolCall("advanced_search");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertEquals(List.of("required", "auto"), sentToolChoices);
    }

    @Test
    void autoTellsTheAgentToSearch() throws Exception {
        agent.setAdvancedSearchMode("AUTO");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(embeddingService, never()).findClosestSections(any(), any(), any());
        assertEquals("Q:What is new? C:", sentMessages.get(0).getLast().getContent());
        assertEquals(List.of("advanced_search"), toolNames(sentTools.get(0)));
        assertEquals("auto", sentToolChoices.get(0));
        assertTrue(sentSystemPrompts.get(0).contains("call advanced_search unless"));
    }

    @Test
    void alwaysRequiresAToolCallOnlyOnTheFirstModelCall() throws Exception {
        agent.setAdvancedSearchMode("ALWAYS");
        respondWithToolCall("advanced_search");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertEquals(List.of("required", "auto"), sentToolChoices);
        assertTrue(sentSystemPrompts.get(0).contains("Always call advanced_search"));
    }

    @Test
    void offOffersNoSearch() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertTrue(sentTools.get(0).isEmpty());
        assertFalse(sentSystemPrompts.get(0).contains("advanced_search"));
    }

    @Test
    void theAnswersSourcesAreTheSectionsItsSearchesFound() throws Exception {
        UUID sectionId = UUID.randomUUID();
        Message answer = saved("assistant", null, "Answer");
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(
                saved("assistant", null, ""),
                saved("tool", "advanced_search", "{\"sections\":[{\"section_id\":\"" + sectionId + "\",\"document_id\":\"" + UUID.randomUUID() + "\"}]}"),
                saved("tool", "lookup", "{\"sections\":[{\"section_id\":\"" + UUID.randomUUID() + "\"}]}"),
                answer));
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(messageService).linkSections(eq(answer), argThat(links ->
                links.size() == 1 && links.get(0).getSectionId().equals(sectionId) && links.get(0).getCompletionParticipant()));
    }

    @Test
    void aTurnThatStillWaitsGetsNoSourcesYet() throws Exception {
        Message waiting = saved("assistant", null, "");
        waiting.setToolCalls(mapper.readTree("[{\"id\":\"call\"}]"));
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(waiting));
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(messageService, never()).linkSections(any(), any());
    }

    @Test
    void aClientToolTheClientAnswersSuspendsTheTurn() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        agent.getAiTools().add(AiTools.builder().type("function").execution("CLIENT").jsonSchema("{\"name\":\"lookup\"}").build());
        respondWithToolCall("lookup");
        CompletionTurn turn = new CompletionTurn();
        turn.setStatus(CompletionTurn.WAITING_FOR_TOOLS);
        turn.setUserMessageId(question.getId());
        turn.setResumeToken("token");
        when(completionTurnService.suspend(eq(question), any(), anyList(), eq(1))).thenReturn(turn);

        CompletionMessageDTO response = service.getCompletionSearch(question, project, new CompletionListener(true));

        assertEquals(1, sentMessages.size());
        assertEquals(CompletionTurn.WAITING_FOR_TOOLS, response.getStatus());
        assertEquals("token", response.getResumeToken());
        verify(aiToolRegistry, never()).execute(eq("lookup"), any(), any());
    }

    @Test
    void aClientThatCannotAnswerGetsTheToolToldItRan() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        agent.getAiTools().add(AiTools.builder().type("function").execution("CLIENT").jsonSchema("{\"name\":\"lookup\"}").build());
        respondWithToolCall("lookup");
        respondWithAnswer();

        CompletionMessageDTO response = service.getCompletionSearch(question, project);

        assertEquals(2, sentMessages.size());
        assertNull(response.getStatus());
        verify(completionTurnService, never()).suspend(any(), any(), anyList(), anyInt());
    }

    @Test
    void aResumedTurnContinuesAfterTheMessagesItAlreadyMade() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        ProjectService projectService = (ProjectService) ReflectionTestUtils.getField(service, "projectService");
        when(projectService.getProjectById(project.getId())).thenReturn(project);
        when(messageService.getMessageWithLocalContexts(question.getId())).thenReturn(question);
        Message call = new Message();
        call.setRole("assistant");
        call.setToolCalls(mapper.readTree("[{\"id\":\"call\",\"function\":{\"name\":\"lookup\",\"arguments\":\"{}\"}}]"));
        Message result = new Message();
        result.setRole("tool");
        result.setToolCallId("call");
        result.setValue("{\"status\":\"shipped\"}");
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(call, result));
        CompletionTurn turn = new CompletionTurn();
        turn.setProjectId(project.getId());
        turn.setUserMessageId(question.getId());
        turn.setIteration(1);
        respondWithAnswer();

        service.resumeCompletionSearch(turn, CompletionListener.none());

        List<AiModelMessage> sent = sentMessages.get(0);
        assertEquals("Q:What is new? C:", sent.get(0).getContent());
        assertEquals("assistant", sent.get(1).getRole());
        assertEquals("{\"status\":\"shipped\"}", sent.get(2).getContent());
    }
}

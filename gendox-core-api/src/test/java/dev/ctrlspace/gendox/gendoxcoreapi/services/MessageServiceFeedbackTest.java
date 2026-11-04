package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.MessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MessageServiceFeedbackTest {

    final MessageRepository messages = mock(MessageRepository.class);
    final MessageService service = new MessageService(messages, null, null, null, null);
    final Message answer = new Message();

    @BeforeEach
    void setup() {
        answer.setId(UUID.randomUUID());
        answer.setRole("assistant");
        answer.setValue("You can return it within 30 days.");
        when(messages.findById(answer.getId())).thenReturn(Optional.of(answer));
        when(messages.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private Message rate(Integer feedback, String comment) throws GendoxException {
        return service.updateFeedback(answer.getId(), MessageDTO.builder()
                .value("ignored").feedback(feedback).feedbackComment(comment).build());
    }

    @Test
    void anAnswerKeepsItsFeedbackAndOnlyThat() throws Exception {
        Message saved = rate(-1, "  It missed the warranty page. ");

        assertEquals(-1, saved.getFeedback());
        assertEquals("It missed the warranty page.", saved.getFeedbackComment());
        assertEquals("You can return it within 30 days.", saved.getValue());
    }

    @Test
    void clearingTheFeedbackClearsItsComment() throws Exception {
        rate(1, "Great");

        Message cleared = rate(null, "Great");

        assertNull(cleared.getFeedback());
        assertNull(cleared.getFeedbackComment());
    }

    @Test
    void onlyAnswersAndOnlyThumbsAreAccepted() {
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(GendoxException.class, () -> rate(5, null)).getHttpStatus());

        answer.setRole("user");
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(GendoxException.class, () -> rate(1, null)).getHttpStatus());
    }
}

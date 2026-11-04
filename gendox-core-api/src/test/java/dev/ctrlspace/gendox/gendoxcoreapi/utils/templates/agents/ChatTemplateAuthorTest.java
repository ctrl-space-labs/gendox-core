package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatTemplateAuthorTest {

    @Test
    void theQuestionCarriesTheDateItWasAsked() {
        Message question = new Message();
        question.setValue("Is this offer still valid?");
        question.setCreatedAt(Instant.parse("2026-11-04T23:30:00Z"));

        String localContexts = new ChatTemplateAuthor().toChatValues(question, "").get("localContexts");

        assertTrue(localContexts.contains("<type>USER_CONTEXT</type>"));
        assertTrue(localContexts.contains("Today: Wednesday, 2026-11-04 (UTC)"));
    }
}

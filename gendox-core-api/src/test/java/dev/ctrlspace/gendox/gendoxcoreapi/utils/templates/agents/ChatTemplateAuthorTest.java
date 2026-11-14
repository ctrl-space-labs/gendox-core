package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.MessageLocalContext;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ChatTemplateAuthorTest {

    @Test
    void theQuestionCarriesTheDateItWasAsked() {
        Message question = new Message();
        question.setValue("Is this offer still valid?");
        question.setCreatedAt(Instant.parse("2026-11-04T23:30:00Z"));

        String localContexts = new ChatTemplateAuthor().toChatValues(question, "", List.of()).get("localContexts");

        assertTrue(localContexts.contains("<type>USER_CONTEXT</type>"));
        assertTrue(localContexts.contains("Today: Wednesday, 2026-11-04 (UTC)"));
    }

    @Test
    void theFilesOfTheConversationAreOneListingAndNeverTheirContent() {
        Message question = new Message();
        MessageLocalContext attached = new MessageLocalContext();
        attached.setContextTypeName("ATTACHED_DOCUMENT");
        attached.setDocument(file("today.pdf"));
        MessageLocalContext page = new MessageLocalContext();
        page.setContextTypeName("GENDOX_PAGE");
        page.setValue("{\"route\":\"/gendox/chat/\"}");
        question.getLocalContexts().addAll(List.of(attached, page));

        String localContexts = new ChatTemplateAuthor()
                .toChatValues(question, "", List.of(file("earlier.pdf"), attached.getDocument())).get("localContexts");

        assertFalse(localContexts.contains("<type>ATTACHED_DOCUMENT</type>"));
        assertTrue(localContexts.contains("<type>GENDOX_PAGE</type>"));
        assertEquals(1, localContexts.split("<type>ATTACHED_FILES</type>", -1).length - 1);
        assertTrue(localContexts.indexOf("./uploads/earlier.pdf | ") < localContexts.indexOf("./uploads/today.pdf | "));
    }

    @Test
    void aConversationWithVeryManyFilesListsTheNewestAndSaysHowManyAreLeftOut() {
        List<DocumentInstance> files = IntStream.rangeClosed(1, 53).mapToObj(i -> file("file-" + i + ".txt")).toList();

        String localContexts = new ChatTemplateAuthor().toChatValues(new Message(), "", files).get("localContexts");

        assertFalse(localContexts.contains("./uploads/file-3.txt | "));
        assertTrue(localContexts.contains("./uploads/file-4.txt | "));
        assertTrue(localContexts.contains("./uploads/file-53.txt | "));
        assertTrue(localContexts.contains("(3 older files are not listed here: list_files shows them all)"));
    }

    private static DocumentInstance file(String title) {
        DocumentInstance file = new DocumentInstance();
        file.setId(UUID.randomUUID());
        file.setTitle(title);
        return file;
    }
}

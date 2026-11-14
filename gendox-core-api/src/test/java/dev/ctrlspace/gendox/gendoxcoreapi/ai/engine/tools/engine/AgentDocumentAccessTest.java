package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadDocumentsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AgentDocumentAccessTest {

    @InjectMocks private AgentDocumentAccess access;
    @Mock private UserService userService;
    @Mock private SecurityUtils securityUtils;
    @Mock private ChatThreadDocumentsRepository chatThreadDocumentsRepository;
    @Mock private MessageLocalContextService messageLocalContextService;

    private final UUID documentId = UUID.randomUUID();
    private final UUID threadId = UUID.randomUUID();
    private ToolExecutionContext context;

    @BeforeEach
    void anAgentInAThread() {
        ProjectAgent agent = new ProjectAgent();
        agent.setId(UUID.randomUUID());
        agent.setUserId(UUID.randomUUID());
        Message question = new Message();
        question.setThreadId(threadId);
        context = new ToolExecutionContext(null, agent, question, null, null, null);
        when(securityUtils.hasAuthority(any(), any(), any())).thenReturn(true);
    }

    @Test
    void aDocumentOfTheKnowledgeBaseIsReadInAnyConversation() {
        when(chatThreadDocumentsRepository.existsByDocumentId(documentId)).thenReturn(false);

        assertDoesNotThrow(() -> access.requireReadable(context, documentId));
    }

    @Test
    void anAttachedFileIsReadOnlyInItsOwnConversation() {
        when(chatThreadDocumentsRepository.existsByDocumentId(documentId)).thenReturn(true);

        when(messageLocalContextService.isDocumentAttachedToThread(threadId, documentId)).thenReturn(true);
        assertDoesNotThrow(() -> access.requireReadable(context, documentId));

        when(messageLocalContextService.isDocumentAttachedToThread(threadId, documentId)).thenReturn(false);
        GendoxException refused = assertThrows(GendoxException.class, () -> access.requireReadable(context, documentId));
        assertEquals("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT", refused.getErrorCode());
    }

    @Test
    void anAgentWithoutAuthorityOverTheDocumentIsRefused() {
        when(securityUtils.hasAuthority(any(), any(), any())).thenReturn(false);

        assertThrows(GendoxException.class, () -> access.requireReadable(context, documentId));
    }
}

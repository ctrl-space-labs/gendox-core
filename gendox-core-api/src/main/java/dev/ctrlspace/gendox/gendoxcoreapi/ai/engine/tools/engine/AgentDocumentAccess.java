package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ChatThreadDocumentsRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.MessageLocalContextService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * The one check before a tool reads a document for an agent: the agent may read the document, and a file
 * attached to a conversation is read only in that conversation.
 */
@Component
public class AgentDocumentAccess {

    private static final Logger logger = LoggerFactory.getLogger(AgentDocumentAccess.class);

    private final UserService userService;
    private final SecurityUtils securityUtils;
    private final ChatThreadDocumentsRepository chatThreadDocumentsRepository;
    private final MessageLocalContextService messageLocalContextService;

    public AgentDocumentAccess(UserService userService,
                               SecurityUtils securityUtils,
                               ChatThreadDocumentsRepository chatThreadDocumentsRepository,
                               MessageLocalContextService messageLocalContextService) {
        this.userService = userService;
        this.securityUtils = securityUtils;
        this.chatThreadDocumentsRepository = chatThreadDocumentsRepository;
        this.messageLocalContextService = messageLocalContextService;
    }

    public void requireReadable(ToolExecutionContext context, UUID documentId) throws GendoxException {
        UUID threadId = context.parentMessage() != null ? context.parentMessage().getThreadId() : null;
        UserProfile agentProfile = userService.getUserProfileByUniqueIdentifier(context.agent().getUserId().toString());

        boolean readable = securityUtils.hasAuthority(agentProfile, "OP_READ_DOCUMENT",
                securityUtils.getRequestedDocumentIdAccessCriteria(documentId.toString()))
                && (!chatThreadDocumentsRepository.existsByDocumentId(documentId)
                || messageLocalContextService.isDocumentAttachedToThread(threadId, documentId));
        if (!readable) {
            logger.error("Agent {} tried to read document {} without permission, in thread {}",
                    context.agent().getId(), documentId, threadId);
            throw new GendoxException("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT",
                    "Agent tried to access document " + documentId + " without proper permissions.",
                    HttpStatus.FORBIDDEN);
        }
    }
}

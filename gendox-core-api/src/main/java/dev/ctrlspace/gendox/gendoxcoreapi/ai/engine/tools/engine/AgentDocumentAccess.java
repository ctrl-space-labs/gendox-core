package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * The one check before a tool reads a document for an agent: the agent may read it, and it may be used in this
 * thread, as a document the user attaches ({@link SecurityUtils#requireDocumentsInProject}).
 */
@Component
public class AgentDocumentAccess {

    private static final Logger logger = LoggerFactory.getLogger(AgentDocumentAccess.class);

    private final UserService userService;
    private final SecurityUtils securityUtils;

    public AgentDocumentAccess(UserService userService, SecurityUtils securityUtils) {
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    public void requireReadable(ToolExecutionContext context, UUID documentId) throws GendoxException {
        UUID threadId = context.parentMessage() != null ? context.parentMessage().getThreadId() : null;
        UserProfile agentProfile = userService.getUserProfileByUniqueIdentifier(context.agent().getUserId().toString());

        if (!securityUtils.hasAuthority(agentProfile, "OP_READ_DOCUMENT",
                securityUtils.getRequestedDocumentIdAccessCriteria(documentId.toString()))) {
            logger.error("Agent {} tried to read document {} without permission, in thread {}",
                    context.agent().getId(), documentId, threadId);
            throw new GendoxException("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT",
                    "Agent tried to access document " + documentId + " without proper permissions.",
                    HttpStatus.FORBIDDEN);
        }
        // the same rule as for a document the user attaches
        securityUtils.requireDocumentsInProject(List.of(documentId), context.project() != null ? context.project().getId() : null, threadId);
    }
}

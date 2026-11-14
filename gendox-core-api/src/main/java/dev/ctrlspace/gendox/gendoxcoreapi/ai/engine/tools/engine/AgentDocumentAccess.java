package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * The one check before a tool reads a document for an agent. The rule is {@link SecurityUtils#canAgentReadDocument}.
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
        UserProfile agentProfile = userService.getUserProfileByUniqueIdentifier(context.agent().getUserId().toString());
        if (!securityUtils.canAgentReadDocument(agentProfile, documentId)) {
            logger.error("Agent {} tried to read document {} without permission", context.agent().getId(), documentId);
            throw new GendoxException("FORBIDDEN_AGENT_ACCESS_TO_DOCUMENT",
                    "Agent tried to access document " + documentId + " without proper permissions.",
                    HttpStatus.FORBIDDEN);
        }
    }
}

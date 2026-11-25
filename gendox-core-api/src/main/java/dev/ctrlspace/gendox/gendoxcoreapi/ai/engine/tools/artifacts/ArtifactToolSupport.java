package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.springframework.http.HttpStatus;

/**
 * What the artifact tools read from a call the same way.
 */
final class ArtifactToolSupport {

    private ArtifactToolSupport() {
    }

    /**
     * The assistant message that carries the call. Its thread is the only one the tools can touch:
     * an artifact of another conversation is not found.
     */
    static Message callMessage(ToolExecutionContext context) throws GendoxException {
        Message message = context.parentMessage();
        if (message == null || message.getThreadId() == null) {
            throw new GendoxException("ARTIFACTS_NEED_A_THREAD",
                    "Artifacts belong to a conversation, and there is none here", HttpStatus.BAD_REQUEST);
        }
        return message;
    }
}
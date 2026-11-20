package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools;

import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * System tools that the client application runs, not Gendox: the desktop app runs {@code run_command} on the
 * user's computer. They are on no agent and have no checkbox. The client says which of them it can run, with
 * each message, and only those are offered to the model for that message; a client that can run none, such
 * as a browser, gets none. Each is a CLIENT tool: the turn waits for the client's result.
 */
public final class ClientTools {

    public static final String RUN_COMMAND = "run_command";

    private static final Map<String, String> DEFINITIONS = new LinkedHashMap<>();

    static {
        DEFINITIONS.put(RUN_COMMAND, """
                {
                  "name": "run_command",
                  "description": "Runs a shell command on the user's computer, through the Gendox desktop app the user is chatting from: a login shell on macOS and Linux, PowerShell on Windows. The user sees the command and its description and may be asked to allow it first; the output streams to the user while it runs, and the user can stop it. Writes are limited to the folders the user allowed. Returns exit_code, stdout, stderr (the last 64 KiB of each) and duration_ms; or declined when the user did not allow it; or app_closed when the app was closed while the call waited.",
                  "parameters": {
                    "type": "object",
                    "properties": {
                      "command": { "type": "string", "description": "The exact shell script to run" },
                      "description": { "type": "string", "description": "What the command does and why, in plain words for the user" },
                      "cwd": { "type": "string", "description": "Optional absolute working folder; the user's selected folder when omitted" },
                      "timeout_seconds": { "type": "integer", "minimum": 1, "maximum": 7200, "description": "Optional; 600 when omitted. The process tree is ended when it runs out." }
                    },
                    "required": ["command", "description"],
                    "additionalProperties": false
                  }
                }""");
    }

    private ClientTools() {
    }

    /** The client tools Gendox defines, among the names a client sent; unknown names are ignored. */
    public static List<AiTools> toolsFor(Collection<String> names) {
        if (names == null || names.isEmpty()) {
            return List.of();
        }
        return DEFINITIONS.entrySet().stream()
                .filter(definition -> names.contains(definition.getKey()))
                .map(definition -> AiTools.builder()
                        .type("function")
                        .execution("CLIENT")
                        .jsonSchema(definition.getValue())
                        .build())
                .toList();
    }

    public static boolean isClientTool(String name) {
        return DEFINITIONS.containsKey(name);
    }
}

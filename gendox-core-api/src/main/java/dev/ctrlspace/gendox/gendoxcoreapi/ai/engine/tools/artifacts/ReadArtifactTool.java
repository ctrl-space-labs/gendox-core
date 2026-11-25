package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ArtifactVersion;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Locale;
import java.util.UUID;

/** Returns the content of an artifact of the conversation, as it is now or at an earlier version. */
@Component
public class ReadArtifactTool extends DefinedToolHandler {

    public static final String NAME = "read_artifact";

    static final String DEFINITION = """
            {
              "name": "read_artifact",
              "description": "Read an artifact of this conversation: its content as it is now, or at an earlier version. Use it before editing an artifact whose current content is not in the conversation, or after an edit failed.",
              "parameters": {
                "type": "object",
                "required": ["artifact_id"],
                "properties": {
                  "artifact_id": {
                    "type": "string",
                    "description": "The artifactId that create_artifact returned."
                  },
                  "version": {
                    "type": "integer",
                    "description": "The version to read. Leave out for the latest."
                  }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(@JsonProperty("artifact_id") UUID artifactId, Integer version) {
    }

    private final ArtifactService artifactService;
    private final ObjectMapper objectMapper;

    public ReadArtifactTool(ArtifactService artifactService, ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.artifactService = artifactService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Message callMessage = ArtifactToolSupport.callMessage(context, artifactService);
        Args args = readArguments(objectMapper, arguments, Args.class);

        Artifact artifact = artifactService.getByIdInThread(callMessage.getThreadId(), args.artifactId());
        ArtifactVersion version = artifactService.getVersion(artifact, args.version());

        ObjectNode result = objectMapper.createObjectNode();
        result.put("artifactId", artifact.getId().toString());
        result.put("title", artifact.getTitle());
        result.put("kind", artifact.getArtifactType().getName().toLowerCase(Locale.ROOT));
        if (artifact.getCodeLanguage() != null) {
            result.put("codeLanguage", artifact.getCodeLanguage());
        }
        result.put("version", version.getVersion());
        result.put("latestVersion", artifact.getLatestVersion());
        if (artifact.getCapabilities() != null) {
            result.set("capabilities", objectMapper.valueToTree(artifact.getCapabilities()));
        }
        result.put("content", version.getContent());
        return result;
    }
}
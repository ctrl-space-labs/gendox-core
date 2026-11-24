package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.artifacts.ArtifactEditDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.UUID;

/** Adds a version to an artifact of the conversation, from edits or from the whole new content. */
@Component
public class UpdateArtifactTool extends DefinedToolHandler {

    public static final String NAME = "update_artifact";

    static final String DEFINITION = """
            {
              "name": "update_artifact",
              "description": "Change an artifact of this conversation; the change becomes a new version. Prefer edits: each replaces one piece of text. Send the whole content only when most of it changes.",
              "parameters": {
                "type": "object",
                "required": ["artifact_id"],
                "properties": {
                  "artifact_id": {
                    "type": "string",
                    "description": "The artifactId that create_artifact returned."
                  },
                  "edits": {
                    "type": "array",
                    "description": "Replacements, applied in order, each on the result of the one before. If one fails, none is applied.",
                    "items": {
                      "type": "object",
                      "required": ["old_text", "new_text"],
                      "properties": {
                        "old_text": {
                          "type": "string",
                          "description": "Text to replace, copied exactly from the artifact. It must occur exactly once."
                        },
                        "new_text": {
                          "type": "string",
                          "description": "The text that takes its place. Empty to delete."
                        }
                      },
                      "additionalProperties": false
                    }
                  },
                  "content": {
                    "type": "string",
                    "description": "The whole new content, instead of edits."
                  },
                  "title": {
                    "type": "string",
                    "description": "A new title. Leave out to keep the current one."
                  },
                  "display": {
                    "type": "string",
                    "enum": ["card", "inline"],
                    "description": "A new display. Leave out to keep the current one. Changing it alone adds no version."
                  }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(@JsonProperty("artifact_id") UUID artifactId, List<ArtifactEditDTO> edits, String content, String title,
                String display) {
    }

    private final ArtifactService artifactService;
    private final ObjectMapper objectMapper;

    public UpdateArtifactTool(ArtifactService artifactService, ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.artifactService = artifactService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Message callMessage = ArtifactToolSupport.callMessage(context);
        Args args = readArguments(objectMapper, arguments, Args.class);

        Artifact artifact = artifactService.update(callMessage.getThreadId(), args.artifactId(), callMessage.getId(),
                args.title(), args.display(), args.content(), args.edits());

        ObjectNode result = objectMapper.createObjectNode();
        result.put("artifactId", artifact.getId().toString());
        result.put("version", artifact.getLatestVersion());
        result.put("title", artifact.getTitle());
        result.put("display", ArtifactToolSupport.displayOf(artifact));
        return result;
    }
}
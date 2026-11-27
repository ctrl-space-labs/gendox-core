package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Artifact;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.List;
import java.util.Locale;

/**
 * Creates an artifact in the conversation. It has no ai_tools row: the artifacts skill brings it
 * through {@code allowed-tools}.
 */
@Component
public class CreateArtifactTool extends DefinedToolHandler {

    public static final String NAME = "create_artifact";

    // the kinds are the ARTIFACT_TYPE types, in lower case
    static final String DEFINITION = """
            {
              "name": "create_artifact",
              "description": "Create an artifact: standalone content shown to the user in its own panel beside the conversation. Returns the artifactId, needed to update or read it later. Read the artifacts skill before the first use.",
              "parameters": {
                "type": "object",
                "required": ["title", "kind", "content"],
                "properties": {
                  "title": {
                    "type": "string",
                    "description": "A short name for the artifact, shown as its tab title."
                  },
                  "kind": {
                    "type": "string",
                    "enum": ["html", "svg", "markdown", "code"],
                    "description": "html: a complete page. svg: one <svg> element. markdown: a document. code: source code, shown highlighted and not run."
                  },
                  "content": {
                    "type": "string",
                    "description": "The whole content of the artifact."
                  },
                  "code_language": {
                    "type": "string",
                    "description": "For kind code only: the programming language, e.g. python."
                  },
                  "capabilities": {
                    "type": "array",
                    "items": {"type": "string", "enum": ["data", "user"]},
                    "description": "What the artifact may ask for: data, to keep what people do inside it; user, to know who is viewing. Leave out when it keeps nothing. Read the artifacts skill first."
                  }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(String title, String kind, String content, @JsonProperty("code_language") String codeLanguage,
                List<String> capabilities) {
    }

    private final ArtifactService artifactService;
    private final ObjectMapper objectMapper;

    public CreateArtifactTool(ArtifactService artifactService, ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.artifactService = artifactService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Message callMessage = ArtifactToolSupport.callMessage(context, artifactService);
        Args args = readArguments(objectMapper, arguments, Args.class);

        Artifact artifact = artifactService.create(callMessage.getThreadId(), callMessage.getProjectId(), callMessage.getId(),
                args.title(), args.kind(), args.codeLanguage(), args.capabilities(), args.content());

        ObjectNode result = objectMapper.createObjectNode();
        result.put("artifactId", artifact.getId().toString());
        result.put("version", artifact.getLatestVersion());
        result.put("title", artifact.getTitle());
        result.put("kind", artifact.getArtifactType().getName().toLowerCase(Locale.ROOT));
        return result;
    }
}
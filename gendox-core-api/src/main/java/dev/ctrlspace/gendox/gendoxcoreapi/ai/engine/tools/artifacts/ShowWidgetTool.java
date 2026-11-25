package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.artifacts;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.DefinedToolHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ArtifactService;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Locale;

/**
 * Shows a widget: something small and interactive that is part of the answer (gendox-core#570). It is not an artifact
 * and nothing is stored: the content stays in this call, saved with the assistant message, and the chat renders it
 * from there. It has no ai_tools row: the artifacts skill brings it through {@code allowed-tools}.
 */
@Component
public class ShowWidgetTool extends DefinedToolHandler {

    public static final String NAME = "show_widget";

    static final String DEFINITION = """
            {
              "name": "show_widget",
              "description": "Show a widget: something small and interactive that is part of your answer, such as a converter, a calculator or a short chart. It is not saved as an artifact and cannot be changed later; to change it, show a new one. Read the artifacts skill before the first use.",
              "parameters": {
                "type": "object",
                "required": ["title", "kind", "content"],
                "properties": {
                  "title": {
                    "type": "string",
                    "description": "A short name for the widget, read by screen readers; it is not shown."
                  },
                  "kind": {
                    "type": "string",
                    "enum": ["html", "svg"],
                    "description": "html: a small page. svg: one <svg> element."
                  },
                  "content": {
                    "type": "string",
                    "description": "The whole content of the widget."
                  }
                },
                "additionalProperties": false
              }
            }
            """;

    record Args(String title, String kind, String content) {
    }

    private final ArtifactService artifactService;
    private final ObjectMapper objectMapper;

    public ShowWidgetTool(ArtifactService artifactService, ObjectMapper objectMapper) {
        super(objectMapper, DEFINITION);
        this.artifactService = artifactService;
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode execute(JsonNode arguments, ToolExecutionContext context) throws GendoxException {
        Args args = readArguments(objectMapper, arguments, Args.class);
        artifactService.checkWidget(args.kind(), args.content());

        ObjectNode result = objectMapper.createObjectNode();
        result.put("shown", true);
        result.put("title", args.title() == null ? "" : args.title().trim());
        result.put("kind", args.kind().trim().toLowerCase(Locale.ROOT));
        return result;
    }
}

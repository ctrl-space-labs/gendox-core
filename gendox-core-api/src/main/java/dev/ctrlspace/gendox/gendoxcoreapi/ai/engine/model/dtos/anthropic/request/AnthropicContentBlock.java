package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.anthropic.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * One entry of a Messages API {@code content} array. Anthropic discriminates these on
 * {@code type}; the six below are every block Gendox sends.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type", visible = true)
@JsonSubTypes({
        @JsonSubTypes.Type(value = AnthropicContentBlock.Text.class, name = "text"),
        @JsonSubTypes.Type(value = AnthropicContentBlock.Image.class, name = "image"),
        @JsonSubTypes.Type(value = AnthropicContentBlock.ToolUse.class, name = "tool_use"),
        @JsonSubTypes.Type(value = AnthropicContentBlock.ToolResult.class, name = "tool_result"),
        @JsonSubTypes.Type(value = AnthropicContentBlock.Thinking.class, name = "thinking"),
        @JsonSubTypes.Type(value = AnthropicContentBlock.RedactedThinking.class, name = "redacted_thinking")
})
public sealed interface AnthropicContentBlock {

    String type();

    record Text(String type, String text,
                @JsonProperty("cache_control") @JsonInclude(JsonInclude.Include.NON_NULL)
                AnthropicCompletionRequest.CacheControl cacheControl) implements AnthropicContentBlock {
        public Text(String text) {
            this("text", text, null);
        }

        /** Closes the cacheable prefix at this block. */
        public Text cached() {
            return new Text(type, text, AnthropicCompletionRequest.CacheControl.ephemeral());
        }
    }

    record Image(String type, ImageSource source) implements AnthropicContentBlock {
        public Image(ImageSource source) {
            this("image", source);
        }
    }

    /** {@code base64} with the data and its media type, or {@code url}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    record ImageSource(String type, @JsonProperty("media_type") String mediaType, String data, String url) {

        /** A {@code data:image/...;base64,...} URI is sent inline; anything else as a URL. */
        public static ImageSource of(String imageUrl) {
            if (imageUrl.startsWith("data:")) {
                int comma = imageUrl.indexOf(',');
                String header = imageUrl.substring("data:".length(), comma);
                String mediaType = header.endsWith(";base64") ? header.substring(0, header.length() - ";base64".length()) : header;
                return new ImageSource("base64", mediaType, imageUrl.substring(comma + 1), null);
            }
            return new ImageSource("url", null, null, imageUrl);
        }
    }

    record ToolUse(String type, String id, String name, JsonNode input) implements AnthropicContentBlock {
        public ToolUse(String id, String name, JsonNode input) {
            this("tool_use", id, name, input);
        }
    }

    record ToolResult(String type,
                      @JsonProperty("tool_use_id") String toolUseId,
                      String content) implements AnthropicContentBlock {
        public ToolResult(String toolUseId, String content) {
            this("tool_result", toolUseId, content);
        }
    }

    /** {@code signature} is verified by Anthropic on replay, so it round-trips untouched. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    record Thinking(String type, String thinking, String signature) implements AnthropicContentBlock {
        public Thinking(String thinking, String signature) {
            this("thinking", thinking, signature);
        }
    }

    /** Reasoning Anthropic encrypted rather than returned. Unreadable, but must still be replayed. */
    record RedactedThinking(String type, String data) implements AnthropicContentBlock {
        public RedactedThinking(String data) {
            this("redacted_thinking", data);
        }
    }
}

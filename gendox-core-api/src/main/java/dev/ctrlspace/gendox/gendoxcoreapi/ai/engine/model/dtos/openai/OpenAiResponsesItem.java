package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;

/**
 * One entry of a Responses API {@code input} or {@code output} array. The same item types flow
 * both ways, which is what lets an assistant turn be replayed as input on the next request.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type", visible = true, defaultImpl = OpenAiResponsesItem.Other.class)
@JsonSubTypes({
        @JsonSubTypes.Type(value = OpenAiResponsesItem.Message.class, name = "message"),
        @JsonSubTypes.Type(value = OpenAiResponsesItem.FunctionCall.class, name = "function_call"),
        @JsonSubTypes.Type(value = OpenAiResponsesItem.FunctionCallOutput.class, name = "function_call_output"),
        @JsonSubTypes.Type(value = OpenAiResponsesItem.Reasoning.class, name = "reasoning")
})
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public sealed interface OpenAiResponsesItem {

    String type();

    record Message(String type, String role, List<Content> content) implements OpenAiResponsesItem {
        public Message(String role, List<Content> content) {
            this("message", role, content);
        }
    }

    /** {@code input_text} on the way in, {@code output_text} on the way back. */
    record Content(String type, String text) {
        public static Content inputText(String text) {
            return new Content("input_text", text);
        }

        public static Content outputText(String text) {
            return new Content("output_text", text);
        }
    }

    /** {@code callId} pairs with FunctionCallOutput; {@code id} is the item's own identity. */
    record FunctionCall(String type, String id, @JsonProperty("call_id") String callId,
                        String name, String arguments) implements OpenAiResponsesItem {
        public FunctionCall(String callId, String name, String arguments) {
            this("function_call", null, callId, name, arguments);
        }
    }

    record FunctionCallOutput(String type, @JsonProperty("call_id") String callId,
                              String output) implements OpenAiResponsesItem {
        public FunctionCallOutput(String callId, String output) {
            this("function_call_output", callId, output);
        }
    }

    /**
     * {@code encryptedContent} is what OpenAI validates when this item is replayed, so it is
     * carried back unchanged. {@code summary} is empty whenever the model judged the turn
     * did not warrant one - that is normal, not a failure.
     */
    record Reasoning(String type, String id, List<SummaryPart> summary,
                     @JsonProperty("encrypted_content") String encryptedContent,
                     String status) implements OpenAiResponsesItem {
    }

    record SummaryPart(String type, String text) {
    }

    /** Built-in tool items (web search, code interpreter). Gendox enables none, so they are skipped. */
    record Other(String type) implements OpenAiResponsesItem {
    }
}

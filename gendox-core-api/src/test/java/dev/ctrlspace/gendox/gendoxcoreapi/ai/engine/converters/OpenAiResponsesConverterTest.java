package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.converters;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.OpenAiResponsesItem;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ContentPart;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class OpenAiResponsesConverterTest {

    private ObjectMapper objectMapper;
    private OpenAiResponsesConverter converter;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        converter = new OpenAiResponsesConverter(objectMapper);
    }

    @Test
    void toInputItems_userImagePartsBecomeInputImages() throws Exception {
        AiModelMessage message = AiModelMessage.builder()
                .role("user")
                .content("Transcribe this page")
                .contentParts(List.of(
                        ContentPart.builder()
                                .type("image_url")
                                .imageUrl(ContentPart.ImageInput.builder().url("data:image/jpeg;base64,AAAA").build())
                                .build(),
                        ContentPart.builder()
                                .type("image_url")
                                .imageUrl(ContentPart.ImageInput.builder().url("https://example.com/page.png").build())
                                .build()))
                .build();

        List<OpenAiResponsesItem> input = converter.toInputItems(List.of(message), UUID.randomUUID());

        assertEquals(1, input.size());
        OpenAiResponsesItem.Message item = assertInstanceOf(OpenAiResponsesItem.Message.class, input.getFirst());
        assertEquals(List.of(
                OpenAiResponsesItem.Content.inputText("Transcribe this page"),
                OpenAiResponsesItem.Content.inputImage("data:image/jpeg;base64,AAAA"),
                OpenAiResponsesItem.Content.inputImage("https://example.com/page.png")
        ), item.content());

        JsonNode json = objectMapper.valueToTree(item).get("content");
        assertEquals("input_image", json.get(1).get("type").asText());
        assertEquals("data:image/jpeg;base64,AAAA", json.get(1).get("image_url").asText());
        assertEquals("auto", json.get(1).get("detail").asText());
        // text parts must not carry the image fields as nulls
        assertFalse(json.get(0).has("image_url"));
        assertFalse(json.get(0).has("detail"));
    }

    @Test
    void toInputItems_textOnlyUserMessageIsUnchanged() {
        AiModelMessage message = AiModelMessage.builder().role("user").content("Hello").build();

        List<OpenAiResponsesItem> input = converter.toInputItems(List.of(message), UUID.randomUUID());

        OpenAiResponsesItem.Message item = assertInstanceOf(OpenAiResponsesItem.Message.class, input.getFirst());
        assertEquals(List.of(OpenAiResponsesItem.Content.inputText("Hello")), item.content());
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class InlineReasoningParserTest {

    @Test
    @DisplayName("splits a real Gemini reply into reasoning and answer")
    void splitsGeminiReply() {
        // Shape captured from a live gemini-3.8-flash call with include_thoughts=true
        String raw = "<thought>**Calculating 17 * 23**\n\nI'll use the difference of squares.\n\n</thought>"
                + "Here is how you can think it through:\n\n17 x 23 = 391";

        InlineReasoningParser.Split split = InlineReasoningParser.split(raw);

        assertEquals("**Calculating 17 * 23**\n\nI'll use the difference of squares.", split.reasoning());
        assertEquals("Here is how you can think it through:\n\n17 x 23 = 391", split.content());
    }

    @Test
    @DisplayName("leaves content untouched when there is no reasoning block")
    void noThoughtBlock() {
        InlineReasoningParser.Split split = InlineReasoningParser.split("Just an answer.");

        assertNull(split.reasoning());
        assertEquals("Just an answer.", split.content());
    }

    @Test
    @DisplayName("collects multiple blocks and keeps the answer fragments in order")
    void multipleBlocks() {
        String raw = "<thought>first</thought>Answer part one. <thought>second</thought>Answer part two.";

        InlineReasoningParser.Split split = InlineReasoningParser.split(raw);

        assertEquals("first\n\nsecond", split.reasoning());
        assertEquals("Answer part one. Answer part two.", split.content());
    }

    @Test
    @DisplayName("a reply that is only reasoning yields a null answer rather than an empty bubble")
    void reasoningOnly() {
        InlineReasoningParser.Split split = InlineReasoningParser.split("<thought>thinking out loud</thought>");

        assertEquals("thinking out loud", split.reasoning());
        assertNull(split.content());
    }

    @Test
    @DisplayName("stops at the first closing tag so prose about the tag cannot swallow the answer")
    void reluctantMatching() {
        String raw = "<thought>reasoning</thought>We use a </thought> marker to close it.";

        InlineReasoningParser.Split split = InlineReasoningParser.split(raw);

        assertEquals("reasoning", split.reasoning());
        assertEquals("We use a </thought> marker to close it.", split.content());
    }

    @Test
    @DisplayName("tolerates null and empty content")
    void nullAndEmpty() {
        assertNull(InlineReasoningParser.split(null).content());
        assertNull(InlineReasoningParser.split(null).reasoning());
        assertEquals("", InlineReasoningParser.split("").content());
    }
}

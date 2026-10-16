package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

/** Only readable content is delivered to the client; signatures stay in the assembled response. */
public record CompletionDelta(String field, String text) {
}

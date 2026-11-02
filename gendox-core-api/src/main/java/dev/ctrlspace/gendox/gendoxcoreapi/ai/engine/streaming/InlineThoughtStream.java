package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import java.util.Locale;
import java.util.function.BiConsumer;

/**
 * Splits streamed text into answer ("value") and reasoning ("reasoningContent") where a model writes
 * its reasoning inline between {@code <thought>} tags. A tag can arrive split across chunks, so the
 * end of the text that could still be the start of a tag is held back until the next chunk.
 */
public final class InlineThoughtStream {

    private static final String OPEN = "<thought>";
    private static final String CLOSE = "</thought>";

    private final BiConsumer<String, String> sink;
    private final StringBuilder pending = new StringBuilder();
    private boolean thinking;

    /** @param sink receives the field ("value" or "reasoningContent") and the text */
    public InlineThoughtStream(BiConsumer<String, String> sink) {
        this.sink = sink;
    }

    public void append(String text) {
        pending.append(text);
        while (!pending.isEmpty()) {
            String value = pending.toString();
            String tag = nextTag();
            int index = value.toLowerCase(Locale.ROOT).indexOf(tag);
            if (index < 0) {
                emitAllButPossibleTag(value, tag);
                return;
            }
            sink.accept(currentField(), value.substring(0, index));
            pending.delete(0, index + tag.length());
            thinking = !thinking;
        }
    }

    public void finish() {
        if (!pending.isEmpty()) {
            sink.accept(currentField(), pending.toString());
        }
        pending.setLength(0);
    }

    private void emitAllButPossibleTag(String value, String tag) {
        int held = possibleTagLength(value, tag);
        int length = value.length() - held;
        if (length > 0) {
            sink.accept(currentField(), value.substring(0, length));
        }
        pending.delete(0, length);
    }

    // The longest end of value that is also the start of tag
    private static int possibleTagLength(String value, String tag) {
        int held = 0;
        for (int n = 1; n < tag.length() && n <= value.length(); n++) {
            if (value.regionMatches(true, value.length() - n, tag, 0, n)) {
                held = n;
            }
        }
        return held;
    }

    private String nextTag() {
        if (thinking) {
            return CLOSE;
        }
        return OPEN;
    }

    private String currentField() {
        if (thinking) {
            return "reasoningContent";
        }
        return "value";
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import java.util.Locale;
import java.util.function.BiConsumer;

/** Holds only a possible tag prefix, so split inline thought tags never leak into the answer. */
public final class InlineThoughtStream {
    private final BiConsumer<String, String> sink;
    private final StringBuilder pending = new StringBuilder();
    private boolean thinking;
    public InlineThoughtStream(BiConsumer<String, String> sink) { this.sink = sink; }
    public void append(String text) {
        pending.append(text);
        String tag = thinking ? "</thought>" : "<thought>";
        while (!pending.isEmpty()) {
            String value = pending.toString();
            int index = value.toLowerCase(Locale.ROOT).indexOf(tag);
            if (index >= 0) {
                sink.accept(thinking ? "reasoningContent" : "value", value.substring(0, index));
                pending.delete(0, index + tag.length());
                thinking = !thinking;
                tag = thinking ? "</thought>" : "<thought>";
                continue;
            }
            int held = 0;
            for (int n = 1; n < tag.length() && n <= value.length(); n++)
                if (value.regionMatches(true, value.length() - n, tag, 0, n)) held = n;
            int length = value.length() - held;
            if (length > 0) sink.accept(thinking ? "reasoningContent" : "value", value.substring(0, length));
            pending.delete(0, length);
            break;
        }
    }
    public void finish() {
        if (!pending.isEmpty()) sink.accept(thinking ? "reasoningContent" : "value", pending.toString());
        pending.setLength(0);
    }
}

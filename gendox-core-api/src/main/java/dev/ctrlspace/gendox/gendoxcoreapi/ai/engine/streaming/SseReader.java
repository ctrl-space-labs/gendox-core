package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.function.BiConsumer;

/** Reads SSE frames, not TCP chunks. Supports CRLF, multiline data, comments and a final EOF frame. */
public final class SseReader {
    private SseReader() {}

    public static void read(InputStream input, BiConsumer<String, String> consumer) throws IOException {
        var reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
        String event = "message";
        var data = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isEmpty()) {
                if (!data.isEmpty()) consumer.accept(event, data.substring(0, data.length() - 1));
                event = "message";
                data.setLength(0);
            } else if (!line.startsWith(":")) {
                int colon = line.indexOf(':');
                String field = colon < 0 ? line : line.substring(0, colon);
                String value = colon < 0 ? "" : line.substring(colon + 1);
                if (value.startsWith(" ")) value = value.substring(1);
                if (field.equals("event")) event = value;
                if (field.equals("data")) data.append(value).append('\n');
            }
        }
        if (!data.isEmpty()) consumer.accept(event, data.substring(0, data.length() - 1));
    }
}

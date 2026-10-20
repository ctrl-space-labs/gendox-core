package dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.function.BiConsumer;

/**
 * Reads a provider's Server-Sent Events stream frame by frame (not by TCP chunk). Handles CRLF line
 * ends, multi-line data, comments, and a last frame that ends without a blank line.
 */
public final class SseReader {

    private SseReader() {
    }

    /** @param consumer receives each frame's event name and data */
    public static void read(InputStream input, BiConsumer<String, String> consumer) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
        String event = "message";
        StringBuilder data = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.isEmpty()) {
                emit(event, data, consumer);
                event = "message";
                data.setLength(0);
                continue;
            }
            if (line.startsWith(":")) {
                continue;
            }

            String field = fieldName(line);
            String value = fieldValue(line);
            if (field.equals("event")) {
                event = value;
            }
            if (field.equals("data")) {
                data.append(value).append('\n');
            }
        }
        emit(event, data, consumer);
    }

    private static void emit(String event, StringBuilder data, BiConsumer<String, String> consumer) {
        if (data.isEmpty()) {
            return;
        }
        // drop the newline after the last data line
        consumer.accept(event, data.substring(0, data.length() - 1));
    }

    private static String fieldName(String line) {
        int colon = line.indexOf(':');
        if (colon < 0) {
            return line;
        }
        return line.substring(0, colon);
    }

    private static String fieldValue(String line) {
        int colon = line.indexOf(':');
        if (colon < 0) {
            return "";
        }
        String value = line.substring(colon + 1);
        if (value.startsWith(" ")) {
            return value.substring(1);
        }
        return value;
    }
}

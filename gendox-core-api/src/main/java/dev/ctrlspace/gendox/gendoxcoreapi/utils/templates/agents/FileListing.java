package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * How a file is shown to an agent, wherever it meets one: the session context, a tool result, a search hit.
 * One line per file: a path that says where the file lives, then its metadata. Tools take the UUID.
 * <pre>./uploads/report.pdf | size=2.4MB | pages=312 | tokens=410000 | modified=2026-11-12 14:03 | UUID=…</pre>
 */
public final class FileListing {

    /** Files attached to the conversation. */
    public static final String UPLOADS = "./uploads";
    /** The agent's knowledge base. */
    public static final String KNOWLEDGE = "./knowledge";

    private static final DateTimeFormatter MODIFIED =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(ZoneOffset.UTC);

    private FileListing() {
    }

    /** The directory, then one line per file. */
    public static String list(String directory, Collection<DocumentInstance> files) {
        return Stream.concat(Stream.of(directory), files.stream().map(file -> line(directory, file)))
                .collect(Collectors.joining("\n"));
    }

    public static String line(String directory, DocumentInstance file) {
        return line(directory, name(file.getTitle(), file.getRemoteUrl()),
                "size", size(file.getFileSizeBytes()),
                "pages", file.getNumberOfPages(),
                "tokens", file.getTotalTokens(),
                "modified", modified(file.getUpdatedAt() != null ? file.getUpdatedAt() : file.getCreatedAt()),
                "UUID", file.getId());
    }

    /** A line with the given fields as key, value, key, value…; a missing value shows as "-". */
    public static String line(String directory, String name, Object... fields) {
        StringBuilder line = new StringBuilder(directory).append("/").append(name);
        for (int i = 0; i < fields.length; i += 2) {
            line.append(" | ").append(fields[i]).append("=").append(fields[i + 1] != null ? fields[i + 1] : "-");
        }
        return line.toString();
    }

    /** The title, or the last part of the file's location when it has none. */
    public static String name(String title, String remoteUrl) {
        if (title != null && !title.isBlank()) {
            return title;
        }
        return remoteUrl == null ? "-" : remoteUrl.substring(remoteUrl.lastIndexOf('/') + 1);
    }

    public static String modified(Instant instant) {
        return instant == null ? null : MODIFIED.format(instant);
    }

    private static String size(Long bytes) {
        if (bytes == null) {
            return null;
        }
        if (bytes < 1024) {
            return bytes + "B";
        }
        if (bytes < 1024 * 1024) {
            return bytes / 1024 + "KB";
        }
        return String.format("%.1fMB", bytes / (1024.0 * 1024.0));
    }
}

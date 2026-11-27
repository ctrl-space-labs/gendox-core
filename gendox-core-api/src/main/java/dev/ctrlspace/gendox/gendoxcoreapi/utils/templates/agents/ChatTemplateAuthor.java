package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.springframework.lang.Nullable;
import org.apache.commons.text.StringSubstitutor;


import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;


public class ChatTemplateAuthor {

    private static final DateTimeFormatter TODAY =
            DateTimeFormatter.ofPattern("EEEE, yyyy-MM-dd", Locale.ENGLISH).withZone(ZoneOffset.UTC);

    /** A thread with more files than this lists its newest; list_files shows the rest. */
    private static final int MAX_LISTED_FILES = 50;


    public String chatTemplate(Message message, String sectionValues, String templateText, List<DocumentInstance> threadFiles,
                               @Nullable String openedArtifacts) {
        String chatGptTemplate = templateText;
        String question = processTemplate(chatGptTemplate, toChatValues(message, sectionValues, threadFiles, openedArtifacts));
        return question;
    }

    /**
     * @param threadFiles     the files attached to the conversation so far. The agent gets their listing, never
     *                        their content: it reads them with tools.
     * @param openedArtifacts the listing of the artifacts the conversation was opened on, or null when it was opened
     *                        on none. The agent gets their listing, never their content: it reads them with tools.
     */
    public Map<String, String> toChatValues(Message message, String sectionValues, List<DocumentInstance> threadFiles,
                                            @Nullable String openedArtifacts) {
        Map<String, String> questionTemplateValues = new HashMap<>();
        questionTemplateValues.put("context", escapePlaceholders(sectionValues));
        questionTemplateValues.put(
                "localContexts",
                Stream.of(
                                Stream.of(sessionItem("USER_CONTEXT", userContext(message))),
                                // an attached document is a line of the files listing, not an item of its own
                                message.getLocalContexts().stream()
                                        .filter(c -> !"ATTACHED_DOCUMENT".equals(c.getContextTypeName()))
                                        .map(c -> sessionItem(c.getContextTypeName(), c.getValue())),
                                threadFiles.isEmpty() ? Stream.<String>empty() : Stream.of(sessionItem("ATTACHED_FILES", listing(threadFiles))),
                                openedArtifacts == null ? Stream.<String>empty() : Stream.of(sessionItem("OPENED_ARTIFACTS", openedArtifacts)))
                        .flatMap(items -> items)
                        .collect(Collectors.joining("\n"))
        );
        questionTemplateValues.put("question", (message.getValue()));
        return questionTemplateValues;
    }

    private String listing(List<DocumentInstance> threadFiles) {
        int older = Math.max(0, threadFiles.size() - MAX_LISTED_FILES);
        return FileListing.list(FileListing.UPLOADS, threadFiles.subList(older, threadFiles.size()))
                + (older > 0 ? "\n(" + older + " older files are not listed here: list_files shows them all)" : "");
    }

    private String sessionItem(String type, String value) {
        return "  <session_item>\n" +
                "    <type>" + escapeUserText(type) + "</type>\n" +
                "    <value>\n" +
                escapeUserText(value) + "\n" +
                "    </value>\n" +
                "  </session_item>";
    }

    /**
     * What the agent knows about the person asking. Only the date for now: the model otherwise takes the
     * end of its training as today. The question's own date, so a resumed turn renders the same text.
     */
    private String userContext(Message message) {
        Instant askedAt = message.getCreatedAt() != null ? message.getCreatedAt() : Instant.now();
        return "Today: " + TODAY.format(askedAt) + " (UTC)";
    }

    public String processTemplate(String template, Map<String, String> values) {
        String result = StringSubstitutor.replace(template, values);
        return result;
    }

    /**
     * If not replaced, the "processTemplate" will break with "infinity loop" error
     *
     * @param input
     * @return
     */
    private String escapePlaceholders(String input) {
        return input.replaceAll("\\$\\{", "\\$\\$\\{");

    }

    private String escapeUserText(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.apache.commons.text.StringSubstitutor;


import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;


public class ChatTemplateAuthor {

    private static final DateTimeFormatter TODAY =
            DateTimeFormatter.ofPattern("EEEE, yyyy-MM-dd", Locale.ENGLISH).withZone(ZoneOffset.UTC);


    public String chatTemplate(Message message, String sectionValues, String templateText) {
        String chatGptTemplate = templateText;
        String question = processTemplate(chatGptTemplate, toChatValues(message, sectionValues));
        return question;
    }

    public Map<String, String> toChatValues(Message message, String sectionValues){
        Map<String, String> questionTemplateValues = new HashMap<>();
        questionTemplateValues.put("context", escapePlaceholders(sectionValues));
        questionTemplateValues.put(
                "localContexts",
                Stream.concat(
                                Stream.of(sessionItem("USER_CONTEXT", userContext(message))),
                                message.getLocalContexts().stream()
                                        .map(c -> sessionItem(c.getContextTypeName(), c.getValue())))
                        .collect(Collectors.joining("\n"))
        );
        questionTemplateValues.put("question", (message.getValue()));
        return questionTemplateValues;
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

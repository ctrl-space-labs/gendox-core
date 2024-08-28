package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import org.apache.commons.text.StringSubstitutor;


import java.util.HashMap;
import java.util.Map;


public class ChatTemplateAuthor {


    public String chatTemplate(Message message, String sectionValues, String templateText) {
        String chatGptTemplate = templateText;
        String question = processTemplate(chatGptTemplate, toChatValues(message, sectionValues));
        return question;
    }

    public Map<String, String> toChatValues(Message message, String sectionValues){
        Map<String, String> questionTemplateValues = new HashMap<>();
        questionTemplateValues.put("context", escapePlaceholders(sectionValues));
        questionTemplateValues.put("question", (message.getValue()));
        return questionTemplateValues;
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
}

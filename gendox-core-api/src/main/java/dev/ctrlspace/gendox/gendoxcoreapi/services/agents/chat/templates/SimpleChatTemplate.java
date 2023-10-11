package dev.ctrlspace.gendox.gendoxcoreapi.services.agents.chat.templates;

import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.ServiceName;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ChatTemplateConstants;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.stereotype.Service;


import java.util.HashMap;
import java.util.Map;



@Service
@ServiceName(ChatTemplateConstants.SIMPLE_TEMPLATE)
public class SimpleChatTemplate implements ChatTemplate {

    @Override
    public String chatTemplate(Message message, String sectionValues) {
        String chatGptTemplate = """
                Context:
                ${context}
                Question:
                ${question}
                """;

        Map<String, String> questionTemplateValues = new HashMap<>();
        questionTemplateValues.put("context", sectionValues);
        questionTemplateValues.put("question", message.getValue());
        String question = processTemplate(chatGptTemplate, questionTemplateValues);
        return question;
    }

    public String processTemplate(String template, Map<String, String> values) {
        String result = StringSubstitutor.replace(template, values);
        return result;
    }
}

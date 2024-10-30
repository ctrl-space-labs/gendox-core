package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import org.apache.commons.text.StringSubstitutor;

import java.util.HashMap;
import java.util.Map;

public class EmbeddingTemplateAuthor {


    public String sectionValueForEmbedding(DocumentInstanceSection section, String documentTitle, String templateText) {
        Map<String, String> values = sectionValuesForEmbedding(section, documentTitle);
        return processTemplate(templateText, values);
    }


    private Map<String, String> sectionValuesForEmbedding(DocumentInstanceSection documentInstanceSection, String documentTitle) {
        Map<String, String> values = new HashMap<>();
        values.put("documentTitle", documentTitle);
        values.put("sectionText", documentInstanceSection.getSectionValue());

        return values;
    }

    private String processTemplate(String template, Map<String, String> values) {
        return StringSubstitutor.replace(template, values);
    }

}

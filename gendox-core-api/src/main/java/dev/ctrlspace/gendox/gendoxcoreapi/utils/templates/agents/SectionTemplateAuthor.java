package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import org.apache.commons.text.StringSubstitutor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


public class SectionTemplateAuthor {



    public String sectionValues(List<DocumentInstanceSection> nearestSections, String templateText) {
        String sectionTemplate = templateText;

        //Map<String, String> sectionTemplateValues = toSectionValues(nearestSections.get(0));
        StringBuilder sb = new StringBuilder();
        sb.append(nearestSections.stream()
                .map(section ->
                        processTemplate(sectionTemplate, toSectionValues(section)))
                .collect(Collectors.joining("\n")));

        return sb.toString();
    }


    public Map<String, String> toSectionValues(DocumentInstanceSection documentInstanceSection) {
        Map<String, String> values = new HashMap<>();
        // TODO fix title
        values.put("documentTitle", documentInstanceSection.getDocumentInstance().getRemoteUrl());
        values.put("sectionText", documentInstanceSection.getSectionValue());
        // TODO fix source
        values.put("source", "gendox.ctrlspace.dev/sections/1");
        values.put("user", "admin");

        return values;
    }


    public String processTemplate(String template, Map<String, String> values) {
        String result = StringSubstitutor.replace(template, values);
        return result;
    }



}

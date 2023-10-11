package dev.ctrlspace.gendox.gendoxcoreapi.services.agents.section.templates;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.ServiceName;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.SectionsTemplateConstants;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@ServiceName(SectionsTemplateConstants.SIMPLE_TEMPLATE)
public class SimpleSectionTemplate implements SectionTemplate {


    @Override
    public String sectionValues(List<DocumentInstanceSection> nearestSections, UUID projectId) {
        String sectionTemplate = """
                Title: ${documentTitle}
                ${sectionText}
                Source: ${source}
                User: ${user}
                ----------------
                """;

        //Map<String, String> sectionTemplateValues = toSectionValues(nearestSections.get(0));
        StringBuilder sb = new StringBuilder();
        sb.append(nearestSections.stream()
                .map(section ->
                        processTemplate(sectionTemplate, toSectionValues(section)))
                .collect(Collectors.joining("\n")));

        return sb.toString();
    }

    @Override
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

    @Override
    public String processTemplate(String template, Map<String, String> values) {
        String result = StringSubstitutor.replace(template, values);
        return result;
    }



}

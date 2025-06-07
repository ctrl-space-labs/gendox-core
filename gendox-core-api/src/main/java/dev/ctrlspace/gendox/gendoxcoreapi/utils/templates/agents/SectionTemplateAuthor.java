package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.agents;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class SectionTemplateAuthor {

    public String sectionValues(List<DocumentInstanceSectionDTO> nearestSections, String templateText, List<String> documentTitles) {
        String sectionTemplate = templateText;

        //Map<String, String> sectionTemplateValues = toSectionValues(nearestSections.get(0));
        StringBuilder sb = new StringBuilder();
        sb.append(nearestSections.stream()
                .map(section -> {
                    // Use the index of each section to retrieve the corresponding document title
                    int index = nearestSections.indexOf(section);
                    return processTemplate(sectionTemplate, toSectionValues(section, documentTitles.get(index)));
                })
                .collect(Collectors.joining("\n"))
        );

        return sb.toString();
    }


    public Map<String, String> toSectionValues(DocumentInstanceSectionDTO documentInstanceSection,String documentTitle ) {
        Map<String, String> values = new HashMap<>();
        values.put("documentTitle", documentTitle);
        if (documentInstanceSection.getDocumentInstanceDTO().getExternalUrl() != null) {
            values.put("source", documentInstanceSection.getDocumentInstanceDTO().getExternalUrl());
        } else {
            values.put("source", "N/A");
        }
        // TODO fix source
        values.put("user", "N/A");
        values.put("sectionText", documentInstanceSection.getSectionValue());


        return values;
    }


    public String processTemplate(String template, Map<String, String> values) {
        String result = StringSubstitutor.replace(template, values);
        return result;
    }



}

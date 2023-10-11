package dev.ctrlspace.gendox.gendoxcoreapi.services.agents.section.templates;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface SectionTemplate {


    public String sectionValues(List<DocumentInstanceSection> nearestSections, UUID projectId);

    public Map<String, String> toSectionValues(DocumentInstanceSection documentInstanceSection);

    public String processTemplate(String template, Map<String, String> values);

}

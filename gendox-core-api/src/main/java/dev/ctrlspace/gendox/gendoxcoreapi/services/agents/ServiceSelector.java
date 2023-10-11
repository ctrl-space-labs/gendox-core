package dev.ctrlspace.gendox.gendoxcoreapi.services.agents;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.chat.templates.ChatTemplate;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.section.templates.SectionTemplate;
import dev.ctrlspace.gendox.gendoxcoreapi.services.agents.documents.DocumentSplitter;
import org.springframework.context.ApplicationContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ServiceSelector {
    private final ApplicationContext applicationContext;

    @Autowired
    public ServiceSelector(ApplicationContext applicationContext){
        this.applicationContext = applicationContext;
    }

    public ChatTemplate getChatTemplateByName(String uniqueName) {
        Map<String, ChatTemplate> serviceBeans = applicationContext.getBeansOfType(ChatTemplate.class);

        for (ChatTemplate template : serviceBeans.values()) {
            ServiceName annotation = template.getClass().getAnnotation(ServiceName.class);
            if (annotation != null && annotation.value().equals(uniqueName)) {
                return template;
            }
        }

        return null;
    }

    public SectionTemplate getSectionTemplateByName(String uniqueName) {
        Map<String, SectionTemplate> serviceBeans = applicationContext.getBeansOfType(SectionTemplate.class);

        for (SectionTemplate template : serviceBeans.values()) {
            ServiceName annotation = template.getClass().getAnnotation(ServiceName.class);
            if (annotation != null && annotation.value().equals(uniqueName)) {
                return template;
            }
        }

        return null;
    }

    public DocumentSplitter getDocumentSplitterByName(String uniqueName) {
        Map<String, DocumentSplitter> serviceBeans = applicationContext.getBeansOfType(DocumentSplitter.class);

        for (DocumentSplitter splitter : serviceBeans.values()) {
            ServiceName annotation = splitter.getClass().getAnnotation(ServiceName.class);
            if (annotation != null && annotation.value().equals(uniqueName)) {
                return splitter;
            }
        }

        return null;
    }
}

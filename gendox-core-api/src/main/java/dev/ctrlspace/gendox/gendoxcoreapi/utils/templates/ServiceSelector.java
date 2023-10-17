package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
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

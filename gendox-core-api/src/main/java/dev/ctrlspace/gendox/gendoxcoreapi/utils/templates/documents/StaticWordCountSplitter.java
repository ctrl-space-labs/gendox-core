package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceName;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.DocumentSplitterConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@ServiceName(DocumentSplitterConstants.STATIC_WORD_COUNT_SPLITTER)
public class StaticWordCountSplitter implements DocumentSplitter {

    @Value("${gendox.documents.wordCount}")
    private int wordCount;

    /**
     * TODO test this, the code is untested only for demo purposes
     * split the document in sections of wordCount words
     *
     * @param document
     * @return
     */
    @Override
    public List<String> split(String document) {

        List<String> sections = new ArrayList<>();
        StringBuilder section = new StringBuilder();
        int counter = 0;
        for (String word : document.split(" ")) {
            section.append(word).append(" ");
            counter++;

            // split the section in this word
            if (counter == wordCount) {
                sections.add(section.toString().trim());
                section = new StringBuilder();
                counter = 0;
            }
        }

        // Add the remaining section if there is any
        if (section.length() > 0) {
            sections.add(section.toString().trim());
        }

        return sections;
    }
}

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
     * split the document in sections of wordCount words
     *
     * @param document
     * @return
     */
    @Override
    public List<String> split(String document) {

        List<String> sections = new ArrayList<>();
        if (document == null || document.trim().isEmpty()) {
            return sections; // return empty list
        }
        String[] lines = document.trim().split("\\r?\\n");
        StringBuilder sectionBuilder = new StringBuilder();
        int sectionWordCount = 0;

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) {
                continue; // skip empty paragraphs
            }

            String[] words = trimmedLine.split("\\s+");
            int lineWordCount = words.length;

            if (sectionWordCount + lineWordCount > wordCount) {
                if (sectionBuilder.length() > 0) {
                    sections.add(sectionBuilder.toString().trim());
                    sectionBuilder.setLength(0);
                    sectionWordCount = 0;
                }
                if (lineWordCount > wordCount) {
                    sections.add(trimmedLine);
                    continue;
                }
            }
            sectionBuilder.append(trimmedLine).append("\n\n");
            sectionWordCount += lineWordCount;
        }

        // Add the remaining section if there is any
        if (sectionBuilder.length() > 0) {
            sections.add(sectionBuilder.toString().trim());
        }

        return sections;
    }
}

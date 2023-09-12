package dev.ctrlspace.gendox.gendoxcoreapi.utils.documents;

import java.util.ArrayList;
import java.util.List;


public class StaticWordCountSplitter implements DocumentSplitter {

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

            // split the section in this word
            if (++counter == wordCount) {
                sections.add(section.toString());
                section = new StringBuilder();
                counter = 0;
            }
        }
        return sections;
    }
}

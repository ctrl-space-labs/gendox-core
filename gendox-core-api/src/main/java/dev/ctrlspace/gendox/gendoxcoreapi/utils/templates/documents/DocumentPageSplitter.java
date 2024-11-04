package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.IntArrayList;
import com.knuddels.jtokkit.api.ModelType;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.DocumentSplitterConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceName;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * TODO: Initial implementation, untested
 */
@Service
@ServiceName(DocumentSplitterConstants.STATIC_WORD_COUNT_SPLITTER)
public class DocumentPageSplitter implements DocumentSplitter {

    @Value("${gendox.documents.tokenCount}")
    private int tokenCount;
    @Value("${gendox.documents.page-separator-template}")
    private String pageSeparatorTemplate;

    @Override
    public List<String> split(String document) {

        EncodingRegistry registry = Encodings.newDefaultEncodingRegistry();
        Encoding enc = registry.getEncodingForModel(ModelType.TEXT_EMBEDDING_3_SMALL);

        // 1. Split the document into sections using the pageSeparatorTemplate and capture page numbers
        List<Section> sections = splitDocumentIntoSections(document);

        List<Section> mergedSections = new ArrayList<>();

        int i = 0;
        while (i < sections.size()) {
            Section currentSection = sections.get(i);
            String mergedContent = currentSection.getContent();
            List<Integer> mergedPages = new ArrayList<>(currentSection.getPagesIncluded());
            int currentTokens = enc.encode(mergedContent).size();
            i += 1;

            // 2. Merge the next section to the current one based on the specified logic
            boolean continueMerging = true;
            while (continueMerging && i < sections.size()) {
                Section nextSection = sections.get(i);
                String nextContent = nextSection.getContent();
                int nextTokens = enc.encode(nextContent).size();
                int totalTokens = currentTokens + nextTokens;

                boolean shouldMerge = false;

                // 2.1 Merge if token count is less than 1.5 times tokenCount
                if (totalTokens < 1.5 * tokenCount) {
                    shouldMerge = true;
                }

                if (shouldMerge) {
                    mergedContent += nextContent;
                    currentTokens = totalTokens;
                    mergedPages.addAll(nextSection.getPagesIncluded());
                    i += 1;
                } else {
                    continueMerging = false;
                }
            }


            // Create the merged section
            Section mergedSection = new Section();
            mergedSection.setContent(mergedContent);
            mergedSection.setPagesIncluded(mergedPages);

            mergedSections.add(mergedSection);
        }

        return mergedSections;
    }

    private List<Section> splitDocumentIntoSections(String document) {
        List<Section> sections = new ArrayList<>();

        // Prepare the regex pattern from the pageSeparatorTemplate
        String regexPattern = Pattern.quote(pageSeparatorTemplate).replace("\\{\\%s\\}", "(\\\\d+)");
        Pattern separatorPattern = Pattern.compile(regexPattern, Pattern.MULTILINE);

        Matcher matcher = separatorPattern.matcher(document);

        int lastIndex = 0;

        while (matcher.find()) {
            int pageNumber = Integer.parseInt(matcher.group(1));
            int start = matcher.start();

            // Set the content of the previous page
            if (lastIndex < start) {
                String content = document.substring(lastIndex, start).trim();

                if (!sections.isEmpty() && !content.isEmpty()) {
                    // Add content to the last section (content belongs to the previous page number)
                    Section lastSection = sections.get(sections.size() - 1);
                    lastSection.setContent(lastSection.getContent() + content);
                }
            }

            // Start a new section with the current page number (the content will be added in the next iteration of the loop)
            Section newSection = new Section();
            newSection.setPagesIncluded(Collections.singletonList(pageNumber));
            sections.add(newSection);

            lastIndex = matcher.end();
        }

        // Handle content after the last separator
        if (lastIndex < document.length()) {
            String content = document.substring(lastIndex).trim();

            if (!sections.isEmpty() && !content.isEmpty()) {
                Section lastSection = sections.get(sections.size() - 1);
                lastSection.setContent(lastSection.getContent() + content);
            }
        }

        return sections;
    }

    private boolean isUnclosedMarkdownBlock(String text) {
        // Check for unclosed code blocks
        int codeBlockDelimiters = countOccurrences(text, "```");
        if (codeBlockDelimiters % 2 != 0) {
            return true;
        }

        // Check for unclosed tables
        int tableDelimiters = countOccurrences(text, "\\|");
        if (tableDelimiters % 2 != 0) {
            return true;
        }

        // Additional markdown checks can be added here
        return false;
    }

    private int countOccurrences(String text, String subString) {
        int count = 0;
        Pattern pattern = Pattern.compile(subString);
        Matcher matcher = pattern.matcher(text);
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private boolean isEntireContentSingleMarkdownBlock(String content) {
        content = content.trim();
        // Check for code block
        if (content.startsWith("```") && content.endsWith("```")) {
            return true;
        }
        // Check for table
        if (content.startsWith("|") && content.endsWith("|")) {
            return true;
        }
        // Add other markdown block checks as needed
        return false;
    }

    private SplitResult adjustSectionSize(String content, int currentTokens, Encoding enc) {
        List<String> lines = Arrays.asList(content.split("\\n"));
        List<String> newContentLines = new ArrayList<>(lines);
        List<String> remainingLines = new ArrayList<>();

        int idx = lines.size() - 1;
        int tokensToRemove = currentTokens - 2 * tokenCount;
        int accumulatedTokens = 0;

        while (accumulatedTokens < tokensToRemove && idx >= 0) {
            String line = lines.get(idx);
            int lineTokens = enc.encode(line).size();
            accumulatedTokens += lineTokens;
            currentTokens -= lineTokens;
            newContentLines.remove(idx);
            remainingLines.add(0, line);
            idx--;

            String newContent = String.join("\n", newContentLines);
            if (isUnclosedMarkdownBlock(newContent)) {
                // Need to remove more lines to close the block
                continue;
            } else {
                if (currentTokens <= 2 * tokenCount) {
                    break;
                }
            }
        }

        String newContent = String.join("\n", newContentLines);
        String remainingContent = String.join("\n", remainingLines);

        return new SplitResult(newContent, remainingContent, currentTokens);
    }
}

class Section {
    private List<Integer> pagesIncluded;
    private String content;

    public List<Integer> getPagesIncluded() {
        return pagesIncluded;
    }

    public void setPagesIncluded(List<Integer> pagesIncluded) {
        this.pagesIncluded = pagesIncluded;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

class SplitResult {
    private String content;
    private String remainingContent;
    private int tokenCount;

    public SplitResult(String content, String remainingContent, int tokenCount) {
        this.content = content;
        this.remainingContent = remainingContent;
        this.tokenCount = tokenCount;
    }

    public String getContent() {
        return content;
    }

    public String getRemainingContent() {
        return remainingContent;
    }

    public int getTokenCount() {
        return tokenCount;
    }
}

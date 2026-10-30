package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents;

import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceName;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.DocumentSplitterConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;


/**
 * Splits a document into sections of about {@code wordCount} words, without breaking its Markdown apart.
 * <p>
 * The document is read as blocks: paragraphs and lists, tables and fenced code. A section holds whole blocks,
 * and lines inside a block stay on their own lines, so a table or a list survives the split. Only a block
 * longer than a section is cut, between its lines: a table repeats its header row in every piece, and code
 * reopens its fence. A heading travels with the block under it, rather than ending the previous section.
 */
@Service
@ServiceName(DocumentSplitterConstants.STATIC_WORD_COUNT_SPLITTER)
public class StaticWordCountSplitter implements DocumentSplitter {

    private static final Pattern TABLE_SEPARATOR = Pattern.compile("^\\|?\\s*:?-+:?\\s*(\\|\\s*:?-+:?\\s*)*\\|?$");
    private static final Pattern HEADING = Pattern.compile("^#{1,6}(\\s.*)?$");
    // only words with a letter or digit count, so table pipes and rules do not
    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]");

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

        StringBuilder sectionBuilder = new StringBuilder();
        int sectionWordCount = 0;

        for (Block block : readBlocks(document)) {
            int blockWordCount = block.wordCount();

            if (sectionWordCount + blockWordCount > wordCount && !sectionBuilder.isEmpty()) {
                sections.add(sectionBuilder.toString());
                sectionBuilder.setLength(0);
                sectionWordCount = 0;
            }
            if (blockWordCount > wordCount) {
                sections.addAll(block.cut(wordCount));
                continue;
            }
            if (!sectionBuilder.isEmpty()) {
                sectionBuilder.append("\n\n");
            }
            sectionBuilder.append(block.text());
            sectionWordCount += blockWordCount;
        }

        // Add the remaining section if there is any
        if (!sectionBuilder.isEmpty()) {
            sections.add(sectionBuilder.toString());
        }

        return sections;
    }

    private static List<Block> readBlocks(String document) {
        String[] lines = document.split("\\r?\\n");
        List<Block> blocks = new ArrayList<>();
        List<String> headings = new ArrayList<>();

        int i = 0;
        while (i < lines.length) {
            String line = lines[i].stripTrailing();
            String trimmed = line.strip();

            if (trimmed.isEmpty()) {
                i++;
                continue;
            }

            Block block;
            if (isFence(trimmed)) {
                String marker = trimmed.substring(0, 3);
                List<String> body = new ArrayList<>();
                i++;
                while (i < lines.length && !lines[i].strip().startsWith(marker)) {
                    body.add(lines[i].stripTrailing());
                    i++;
                }
                // an unclosed fence runs to the end of the document, and is closed here
                i++;
                block = new Block(List.of(line), body, List.of(marker));
            } else if (trimmed.startsWith("|")) {
                List<String> rows = new ArrayList<>();
                while (i < lines.length && lines[i].strip().startsWith("|")) {
                    rows.add(lines[i].strip());
                    i++;
                }
                boolean hasHeader = rows.size() >= 2 && TABLE_SEPARATOR.matcher(rows.get(1)).matches();
                block = hasHeader
                        ? new Block(rows.subList(0, 2), rows.subList(2, rows.size()), List.of())
                        : new Block(List.of(), rows, List.of());
            } else if (HEADING.matcher(trimmed).matches()) {
                headings.add(trimmed);
                i++;
                continue;
            } else {
                List<String> paragraph = new ArrayList<>();
                while (i < lines.length) {
                    String next = lines[i].strip();
                    if (next.isEmpty() || isFence(next) || next.startsWith("|") || HEADING.matcher(next).matches()) {
                        break;
                    }
                    paragraph.add(lines[i].stripTrailing());
                    i++;
                }
                block = new Block(List.of(), paragraph, List.of());
            }

            blocks.add(block.withHeadings(headings));
            headings = new ArrayList<>();
        }

        if (!headings.isEmpty()) {
            blocks.add(new Block(List.of(), List.of(), List.of()).withHeadings(headings));
        }
        return blocks;
    }

    private static boolean isFence(String trimmedLine) {
        return trimmedLine.startsWith("```") || trimmedLine.startsWith("~~~");
    }

    static int countWords(String line) {
        int count = 0;
        for (String word : line.strip().split("\\s+")) {
            if (WORD.matcher(word).find()) {
                count++;
            }
        }
        return count;
    }

    /**
     * Lines that belong together. {@code head} and {@code tail} wrap every piece the block is cut into
     * (a table's header row, a code fence); {@code headings} open only the first.
     */
    private record Block(List<String> headings, List<String> head, List<String> body, List<String> tail) {

        Block(List<String> head, List<String> body, List<String> tail) {
            this(List.of(), head, body, tail);
        }

        Block withHeadings(List<String> headings) {
            return new Block(List.copyOf(headings), head, body, tail);
        }

        int wordCount() {
            return wordsIn(headings) + wordsIn(head) + wordsIn(body);
        }

        String text() {
            return piece(true, body);
        }

        /** Cuts between body lines; a single line longer than a section stays whole. */
        List<String> cut(int maxWords) {
            List<String> pieces = new ArrayList<>();
            List<String> lines = new ArrayList<>();
            int words = wordsIn(headings) + wordsIn(head);
            boolean first = true;

            for (String line : body) {
                int lineWords = StaticWordCountSplitter.countWords(line);
                if (!lines.isEmpty() && words + lineWords > maxWords) {
                    pieces.add(piece(first, lines));
                    first = false;
                    lines = new ArrayList<>();
                    words = wordsIn(head);
                }
                lines.add(line);
                words += lineWords;
            }
            if (!lines.isEmpty() || first) {
                pieces.add(piece(first, lines));
            }
            return pieces;
        }

        private String piece(boolean withHeadings, List<String> lines) {
            List<String> parts = new ArrayList<>();
            if (withHeadings && !headings.isEmpty()) {
                parts.add(String.join("\n\n", headings));
            }
            List<String> block = new ArrayList<>(head);
            block.addAll(lines);
            block.addAll(tail);
            if (!block.isEmpty()) {
                parts.add(String.join("\n", block));
            }
            return String.join("\n\n", parts);
        }

        private static int wordsIn(List<String> lines) {
            return lines.stream().mapToInt(StaticWordCountSplitter::countWords).sum();
        }
    }
}

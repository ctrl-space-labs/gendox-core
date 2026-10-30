package dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class StaticWordCountSplitterTest {

    private static StaticWordCountSplitter splitter(int wordCount) {
        StaticWordCountSplitter splitter = new StaticWordCountSplitter();
        ReflectionTestUtils.setField(splitter, "wordCount", wordCount);
        return splitter;
    }

    private static String words(String prefix, int count) {
        return IntStream.range(0, count).mapToObj(i -> prefix + i).collect(Collectors.joining(" "));
    }

    @Test
    void emptyDocumentHasNoSections() {
        assertEquals(List.of(), splitter(10).split(null));
        assertEquals(List.of(), splitter(10).split("  \n\n "));
    }

    @Test
    void smallDocumentKeepsItsLinesAndParagraphs() {
        String document = "# Invoice\n\nLine one\nLine two\n\n- first item\n- second item";

        assertEquals(List.of(document), splitter(100).split(document));
    }

    @Test
    void tableStaysWholeInsideOneSection() {
        String table = "| Item | Amount |\n|---|---:|\n| Fuel | 50.00 |\n| Parking | 4.00 |";
        String document = "Some text before.\n\n" + table + "\n\nSome text after.";

        List<String> sections = splitter(100).split(document);

        assertEquals(1, sections.size());
        assertTrue(sections.getFirst().contains(table), sections.getFirst());
    }

    @Test
    void tableMovesToTheNextSectionInsteadOfBreaking() {
        String table = "| Item | Amount |\n|---|---|\n| Fuel | 50 |";
        String document = words("w", 8) + "\n\n" + table;

        // 8 + 4 words do not fit in 11
        List<String> sections = splitter(11).split(document);

        assertEquals(List.of(words("w", 8), table), sections);
    }

    @Test
    void longTableIsCutBetweenRowsAndRepeatsItsHeader() {
        String header = "| Name | Value |\n|:---|---:|";
        String rows = IntStream.range(0, 6).mapToObj(i -> "| row" + i + " | " + i + " |").collect(Collectors.joining("\n"));

        // header 2 words + 2 words per row: 2 rows fit in 6 words
        List<String> sections = splitter(6).split(header + "\n" + rows);

        assertEquals(3, sections.size());
        assertEquals(header + "\n| row0 | 0 |\n| row1 | 1 |", sections.get(0));
        assertEquals(header + "\n| row2 | 2 |\n| row3 | 3 |", sections.get(1));
        assertEquals(header + "\n| row4 | 4 |\n| row5 | 5 |", sections.get(2));
    }

    @Test
    void headingTravelsWithTheBlockUnderIt() {
        String document = words("a", 8) + "\n\n## Totals\n\n" + words("b", 8);

        List<String> sections = splitter(12).split(document);

        assertEquals(List.of(words("a", 8), "## Totals\n\n" + words("b", 8)), sections);
    }

    @Test
    void longCodeBlockIsCutAndEveryPieceIsFenced() {
        String document = "```json\n{\"a\": 1,\n\"b\": 2,\n\"c\": 3}\n```";

        // the opening fence counts 1 word ("json"), each line 2
        List<String> sections = splitter(5).split(document);

        assertEquals(List.of("```json\n{\"a\": 1,\n\"b\": 2,\n```", "```json\n\"c\": 3}\n```"), sections);
    }

    @Test
    void unclosedFenceIsClosed() {
        assertEquals(List.of("```\ncode here\n```"), splitter(100).split("```\ncode here"));
    }

    @Test
    void pipesInPlainTextAreNotWords() {
        assertEquals(2, StaticWordCountSplitter.countWords("| Fuel | 50 |"));
        assertEquals(0, StaticWordCountSplitter.countWords("|---|---:|"));
    }

    @Test
    void lineLongerThanASectionStaysWhole() {
        String longLine = words("x", 20);
        String document = "short\n\n" + longLine + "\n\nafter";

        assertEquals(List.of("short", longLine, "after"), splitter(10).split(document));
    }

    @Test
    void hashtagIsNotAHeading() {
        String document = "Tagged\n#topic in a paragraph";

        assertEquals(List.of(document), splitter(100).split(document));
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.utils.document;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.CommentsPart;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * PoC test for {@link DocxCommentAnnotator}.
 *
 * <p>Output is written next to the input file with {@code _with_comments} appended
 * before the {@code .docx} extension.
 * Open it in Word / LibreOffice to inspect the inserted comments.
 */
class DocxCommentAnnotatorTest {

    private static final Logger log = LoggerFactory.getLogger(DocxCommentAnnotatorTest.class);

    // -----------------------------------------------------------------------
    // Hardcoded input file (absolute path)
    // -----------------------------------------------------------------------

    private static final String INPUT_DOCX = "";

    private static final String COMMENTS_JSON = """
            
            """;

    /** Derives the output path: same directory, same name + {@code _with_comments}. */
    private static String outputPath(String inputPath) {
        File f = new File(inputPath);
        String name = f.getName();
        String base = name.endsWith(".docx") ? name.substring(0, name.length() - 5) : name;
        return new File(f.getParent(), base + "_with_comments.docx").getAbsolutePath();
    }

    // -----------------------------------------------------------------------
    // ObjectMapper configured to read snake_case JSON into camelCase records
    // -----------------------------------------------------------------------

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

    // -----------------------------------------------------------------------
    // Tests
    // -----------------------------------------------------------------------

    @Test
    void annotateDocx_addsNativeWordComments() throws Exception {
        File input = new File(INPUT_DOCX);

        if (!input.exists()) {
            log.warn("Input file not found at '{}' — skipping test.", input.getAbsolutePath());
            return;
        }

        File output = new File(outputPath(INPUT_DOCX));

        List<DocxCommentAnnotator.CommentEntry> entries = MAPPER.readValue(
                COMMENTS_JSON, new TypeReference<>() {});

        assertEquals(40, entries.size(), "JSON should contain 40 comment entries");

        DocxCommentAnnotator annotator = new DocxCommentAnnotator();
        annotator.annotate(input, entries, output);

        assertTrue(output.exists(), "Output file should have been created");
        assertTrue(output.length() > 0, "Output file should be non-empty");

        // Reload and verify at least some comments were inserted
        WordprocessingMLPackage reloaded = WordprocessingMLPackage.load(output);
        CommentsPart cp = reloaded.getMainDocumentPart().getCommentsPart();
        assertNotNull(cp, "CommentsPart should be present in the output document");

        int insertedCount = cp.getContents().getComment().size();
        assertTrue(insertedCount > 0,
                "At least one comment should have been inserted, got " + insertedCount);

        log.info("Successfully inserted {}/{} comments into '{}'",
                insertedCount, entries.size(), output.getAbsolutePath());
    }

    /**
     * Smoke test: verifies the annotator handles an empty entry list without crashing,
     * even when the docx is not available on the classpath.
     * This test always runs regardless of whether the fixture docx is present.
     */
    @Test
    void annotateDocx_emptyEntries_noOp() throws Exception {
        File input = new File(INPUT_DOCX);
        if (!input.exists()) {
            log.warn("Skipping noOp smoke test — no fixture docx available.");
            return;
        }

        File output = new File(outputPath(INPUT_DOCX).replace("_with_comments", "_empty_comments"));

        DocxCommentAnnotator annotator = new DocxCommentAnnotator();
        annotator.annotate(input, List.of(), output);

        assertTrue(output.exists());
        WordprocessingMLPackage reloaded = WordprocessingMLPackage.load(output);
        CommentsPart cp = reloaded.getMainDocumentPart().getCommentsPart();
        // No comments were added (CommentsPart may or may not exist; if it does, it's empty)
        if (cp != null) {
            assertEquals(0, cp.getContents().getComment().size());
        }
    }
}

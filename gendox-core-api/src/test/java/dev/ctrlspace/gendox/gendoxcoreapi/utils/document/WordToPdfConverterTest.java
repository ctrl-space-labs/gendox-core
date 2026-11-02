package dev.ctrlspace.gendox.gendoxcoreapi.utils.document;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class WordToPdfConverterTest {

    private final WordToPdfConverter converter = new WordToPdfConverter();

    @Test
    void convertDocxToPdf_producesReadablePdf(@TempDir Path tempDir) throws Exception {
        ClassPathResource docx = new ClassPathResource("/test-data/word-docs/file-sample_100kB.docx");
        assertTrue(docx.exists(), "test DOCX must exist on classpath");

        Path docxPath = tempDir.resolve("sample.docx");
        Files.copy(docx.getInputStream(), docxPath);

        Path pdfPath = converter.convertDocxToPdf(docxPath);

        assertTrue(Files.exists(pdfPath), "PDF file should exist");
        assertTrue(Files.size(pdfPath) > 0, "PDF should not be empty");

        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            assertTrue(doc.getNumberOfPages() >= 1, "PDF should have at least one page");
        }

        // second call should reuse cache
        Path cached = converter.convertDocxToPdf(docxPath);
        assertEquals(pdfPath, cached);
    }

    @Test
    void convertDocxToPdf_writesThePdfNextToTheDocx(@TempDir Path tempDir) throws Exception {
        Path docxPath = tempDir.resolve("run-1-sample.docx");
        Files.copy(new ClassPathResource("/test-data/word-docs/file-sample_100kB.docx").getInputStream(), docxPath);

        Path pdfPath = converter.convertDocxToPdf(docxPath);

        // it shares the DOCX's prefix, so it is deleted with it
        assertEquals(tempDir.resolve("run-1-sample.docx.pdf"), pdfPath);
        try (var files = Files.list(tempDir)) {
            assertEquals(2, files.count(), "no partial file is left behind");
        }
    }
}

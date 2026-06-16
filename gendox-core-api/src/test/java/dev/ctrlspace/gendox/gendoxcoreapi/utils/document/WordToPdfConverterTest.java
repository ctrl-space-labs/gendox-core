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

        Path pdfPath = converter.convertDocxToPdf(docxPath, "classpath:sample.docx", tempDir);

        assertTrue(Files.exists(pdfPath), "PDF file should exist");
        assertTrue(Files.size(pdfPath) > 0, "PDF should not be empty");

        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            assertTrue(doc.getNumberOfPages() >= 1, "PDF should have at least one page");
        }

        // second call should reuse cache
        Path cached = converter.convertDocxToPdf(docxPath, "classpath:sample.docx", tempDir);
        assertEquals(pdfPath, cached);
    }
}

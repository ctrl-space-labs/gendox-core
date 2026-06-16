package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.documents.DocPageToImageOptions;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.WordToPdfConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.DocxFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.ExcelFileReader;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.document.readers.PptxFileReader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.ResourceLoader;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;

/**
 * Integration-style tests for DOCX → PDF → PDFBox paths in {@link DownloadService}.
 */
class DownloadServiceDocxPdfTest {

    private DownloadService downloadService;
    private ResourceLoader resourceLoader;

    @BeforeEach
    void setUp() {
        resourceLoader = new DefaultResourceLoader();
        DownloadService downloadServiceRef = mock(DownloadService.class);
        ImageUtils imageUtils = spy(new ImageUtils(downloadServiceRef));
        downloadService = new DownloadService(
                resourceLoader,
                imageUtils,
                "Page %s\n",
                new ExcelFileReader(),
                new DocxFileReader(),
                new DocFileReader(),
                new PptxFileReader(),
                new WordToPdfConverter()
        );
    }

    @Test
    void countDocumentPages_docx_usesPdfConversion(@TempDir Path ignored) throws Exception {
        String url = "classpath:/test-data/word-docs/file-sample_100kB.docx";
        Integer pages = downloadService.countDocumentPages(url);
        assertNotNull(pages);
        assertTrue(pages >= 1, "DOCX converted to PDF should report at least one page");
    }

    @Test
    void printDocumentPages_docx_returnsOneImagePerPage() throws Exception {
        String url = "classpath:/test-data/word-docs/file-sample_100kB.docx";
        Path docxPath = downloadService.downloadToTemp(url, "test");

        int pageCount = downloadService.countDocumentPages(url);
        DocPageToImageOptions options = DocPageToImageOptions.builder()
                .pageFrom(0)
                .pageTo(pageCount - 1)
                .minSide(1024)
                .build();

        List<String> images = downloadService.printDocumentPages(url, docxPath, options);

        assertEquals(pageCount, images.size(), "one rendered image per PDF page");
        assertTrue(images.getFirst().startsWith("data:image/"), "expected base64 JPEG data URI");
    }

    @Test
    void readDocumentPages_docx_alignsWithPdfPageCount() throws Exception {
        String url = "classpath:/test-data/word-docs/file-sample_100kB.docx";
        int pageCount = downloadService.countDocumentPages(url);
        List<String> texts = downloadService.readDocumentPages(url);
        assertEquals(pageCount, texts.size(), "text pages should match PDF page count");
    }

    @Test
    void readDocumentPages_pdf_alignsWithPageCount() throws Exception {
        String url = "classpath:/book-math.pdf";
        int pageCount = downloadService.countDocumentPages(url);
        List<String> texts = downloadService.readDocumentPages(url);
        assertEquals(pageCount, texts.size(), "one text entry per PDF page");
    }
}

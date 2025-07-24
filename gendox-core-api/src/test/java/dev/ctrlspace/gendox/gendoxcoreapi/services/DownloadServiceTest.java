package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.EncodingRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.ImageUtils;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.io.File;
import java.io.FileNotFoundException;
import java.net.URL;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class DownloadServiceTest {

    Logger logger = LoggerFactory.getLogger(this.getClass());


    @InjectMocks
    private DownloadService downloadService;

    @Spy
    private ImageUtils imageUtils = new ImageUtils();

    @Test
    void readDocxContent_SampleDocx() throws Exception {
        // given
        Resource docx = new ClassPathResource("/test-data/word-docs/file-sample_100kB.docx");   // src/test/resources/sample.docx
        String expectedText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc ac faucibus odio";
        String expectedImage = "data:image/jpeg;base64";

        // when
        String actual = downloadService.readDocxContent(docx);


        assertTrue(actual.contains(expectedText), "Service output should contain expected Markdown");
        assertTrue(actual.contains(expectedImage), "Service output should contain expected table column");

    }



    @Test
    void readWordContent_FormattedDocx() throws Exception {
        // given
        Resource docx = new ClassPathResource("/test-data/word-docs/file-sample-multiple-formats.docx");   // src/test/resources/sample.docx
        String expectedText = "This document demonstrates";
        String expectedTableColumn = "| Highlighter |"; // table entry, if it breaks, might need adjustment
        String expectedTableHeader = "| College";
        String expectedFooter = "Endnotes are typically used for longer notes";

        // when
        String actual = downloadService.readDocxContent(docx);


        assertTrue(actual.contains(expectedText), "Service output should contain expected Markdown");
        assertTrue(actual.contains(expectedTableColumn), "Service output should contain expected table column");
        assertTrue(actual.contains(expectedTableHeader), "Service output should contain expected table header");
        assertTrue(actual.contains(expectedFooter), "Service output should contain expected footer");
        // verify that the converter was called with the correct document

    }

    @Disabled("Not implemented yet")
    @Test
    void readDocxContent_SampleDoc() throws Exception {

        assertTrue(false, "Not implemented yet");
    }

    @Disabled("Not implemented yet")
    @Test
    void readDocxContent_SamplePptx() throws Exception {
        assertTrue(false, "Not implemented yet");

    }



    @Test
    void pdfToBase64Pages_readAll() throws Exception {

        // Use the classloader to get the resource
        ClassLoader classLoader = DownloadService.class.getClassLoader();
        URL resourceUrl = classLoader.getResource("HECROS1764.pdf");

        if (resourceUrl == null) {
            throw new FileNotFoundException("Resource not found");
        }

        // Get the file path (works only if running from IDE or unpacked classes)
        File file = new File(resourceUrl.toURI());

        Resource resource = new FileSystemResource(file);



        List<String> printedPages = downloadService.pdfToBase64Pages(resource, 0, 10);

        assertEquals(printedPages.size(),  10, "Expected 10 pages in the PDF document");


    }




}

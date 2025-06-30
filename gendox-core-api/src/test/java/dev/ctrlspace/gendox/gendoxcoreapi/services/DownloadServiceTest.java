package dev.ctrlspace.gendox.gendoxcoreapi.services;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class DownloadServiceTest {

    Logger logger = LoggerFactory.getLogger(this.getClass());


    @InjectMocks
    private DownloadService downloadService;     // class under test

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
}

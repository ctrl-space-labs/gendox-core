package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.ObservabilityTags;
import io.micrometer.observation.annotation.Observed;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.List;

@Service
public class DownloadService {


    private ResourceLoader resourceLoader;


    private String pageSeparatorTemplate;




    @Autowired
    public DownloadService(ResourceLoader resourceLoader,
                           @Value("${gendox.documents.page-separator-template}") String pageSeparatorTemplate
                            ) {
        this.resourceLoader = resourceLoader;
        this.pageSeparatorTemplate = pageSeparatorTemplate;

    }

    public String readDocumentContent(String documentUrl) throws GendoxException, IOException {
        // Get the Resource from openResource
        Resource resource = openResource(documentUrl);

        // Try-with-resources to ensure InputStream is closed after use
        try (InputStream inputStream = resource.getInputStream()) {
            // Determine file extension from Resource
            // TODO Double check this get login
            //  get extension from documentUrl, and if null, try the resource.getFilename()
            String fileExtension = getFileExtension(documentUrl);
            if (fileExtension == null) {
                fileExtension = getFileExtension(resource.getFilename());
            }
            if (fileExtension == null) {
                throw new GendoxException("ERROR_UNKNOWN_FILE_TYPE", "Unknown file type: " + fileExtension, HttpStatus.BAD_REQUEST);
            }

            if (isTextFile(fileExtension)) {
                // Handle text files
                return readTxtFileContent(inputStream);
            } else if (isPdfFile(fileExtension)) {
                // Handle PDF files
                return readPdfContent(resource);
            } else {
                throw new GendoxException("ERROR_UNSUPPORTED_FILE_TYPE", "Unsupported file type: " + fileExtension, HttpStatus.BAD_REQUEST);
            }
        }
    }

    @Observed(name = "DownloadService.readTxtFileContent",
            contextualName = "DownloadService#readTxtFileContent",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    private String readTxtFileContent(InputStream inputStream) throws IOException {
        StringBuilder fileContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                fileContent.append(line).append("\n");
            }
        }

        return fileContent.toString();
    }


    public Resource openResource(String fileUrl) throws GendoxException {
        try {
            return resourceLoader.getResource(fileUrl);
        } catch (Exception e) {
            throw new GendoxException("ERROR_OPENING_RESOURCE", "Error opening resource: " + fileUrl, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Observed(name = "DownloadService.readPdfContent",
            contextualName = "DownloadService#readPdfContent",
            lowCardinalityKeyValues = {
                    ObservabilityTags.LOGGABLE, "true",
                    ObservabilityTags.LOG_LEVEL, ObservabilityTags.LOG_LEVEL_INFO,
                    ObservabilityTags.LOG_METHOD_NAME, "true",
                    ObservabilityTags.LOG_ARGS, "false"
            })
    private String readPdfContent(Resource fileResource) throws IOException {
        // Use the PagePdfDocumentReader to read the PDF content
        var pages = new PagePdfDocumentReader(fileResource).get();

        // Concatenate all pages' content
        StringBuilder allPagesContent = new StringBuilder();
        pages.stream()
                .filter(page -> page.getContent().length() > 10)
                .forEach(page -> allPagesContent
                        .append(String.format(pageSeparatorTemplate, page.getMetadata().get("page_number")))
                        .append(page.getContent()));

        return allPagesContent.toString().replace("\u0000", "");
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex >= 0) {
            return filename.substring(lastDotIndex);
        }
        return null;
    }

    private boolean isTextFile(String extension) {
        return List.of(".txt", ".md", ".csv", ".log").contains(extension);
    }

    private boolean isPdfFile(String extension) {
        return ".pdf".equals(extension);
    }
}

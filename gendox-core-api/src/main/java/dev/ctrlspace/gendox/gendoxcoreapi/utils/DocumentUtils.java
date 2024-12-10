package dev.ctrlspace.gendox.gendoxcoreapi.utils;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ApiKey;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ApiKeyService;
import dev.ctrlspace.gendox.integrations.gendox.api.model.dto.ContentDTO;
import dev.ctrlspace.gendox.integrations.gendox.api.services.GendoxAPIIntegrationService;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeResponse;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.WritableResource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.UUID;

@Component
public class DocumentUtils {

    Logger logger = LoggerFactory.getLogger(DocumentUtils.class);

    @Value("${proven-ai.sdk.iscc.enabled}")
    private Boolean isccEnabled;
    @Value("${gendox.documents.upload-dir}")
    private String uploadDir;

    private GendoxAPIIntegrationService gendoxAPIIntegrationService;
    private IsccCodeService isccCodeService;
    private MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter;
    private ApiKeyService apiKeyService;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    public DocumentUtils(GendoxAPIIntegrationService gendoxAPIIntegrationService,
                         IsccCodeService isccCodeService,
                         MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter,
                         ApiKeyService apiKeyService) {
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.isccCodeService = isccCodeService;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
        this.apiKeyService = apiKeyService;
    }



    public String getApiIntegrationDocumentTitle(Long contentId, Integration integration) throws GendoxException {
        String url = integration.getUrl() + integration.getDirectoryPath() + "/content?content_id=" + contentId;
        String apiKey = apiKeyService.getByIntegrationId(integration.getId()).getApiKey();
        ContentDTO contentDTO = gendoxAPIIntegrationService.getContentById(url, apiKey);
        return contentDTO.getTitle();
    }

    //TODO GIANNIS implement this method
    public String getISCCCodeForApiIntegrationFile() {
        return UUID.randomUUID().toString();
    }


    public String getIsccCode(MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String documentIsccCode = null;
        if (isccEnabled) {
            IsccCodeResponse isccCodeResponse = isccCodeService.getDocumentIsccCode(file, fileName);
            documentIsccCode = isccCodeResponse.getIscc();
        } else {
            UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(file, fileName);
            documentIsccCode = uniqueIdentifierCodeResponse.getUuid();
        }
        return documentIsccCode;
    }

    public String saveFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException {
        String fileName = file.getOriginalFilename();
        String cleanFileName = Paths.get(fileName).getFileName().toString();
        String filePathPrefix = organizationId + "/" + projectId;
        String fullFilePath = uploadDir + "/" + filePathPrefix + "/" + cleanFileName;

        createLocalFileDirectory(filePathPrefix);

        WritableResource writableResource = (WritableResource) resourceLoader.getResource(fullFilePath);
        try (OutputStream outputStream = writableResource.getOutputStream()) {
            byte[] bytes = file.getBytes();
            outputStream.write(bytes);
        }
        return fullFilePath;
    }


    public void createLocalFileDirectory(String filePath) throws IOException {
        // Create the directories if they don't exist in the local file system
        if (uploadDir.startsWith("file:")) {
            Path directoryPath = Paths.get(uploadDir.replaceFirst("^file:", ""), filePath);
            if (!Files.exists(directoryPath)) {
                Files.createDirectories(directoryPath);
                logger.debug("Created directories at: {}", directoryPath);
            } else {
                logger.debug("Directories already exist at: {}", directoryPath);
            }
        }

    }


    @NotNull
    public static String calculateFilePathPrefix(UUID organizationId) {
        // Get the current date
        LocalDate currentDate = LocalDate.now();

        // Format the date components
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue()); // Zero-padded month
        String day = String.format("%02d", currentDate.getDayOfMonth());   // Zero-padded day

        // Construct the folder structure
        String folderStructure = organizationId.toString() + "/" + year + "/" + month + "/" + day;
        return folderStructure;
    }


    public String extractDocumentNameFromUrl(String url) {
        Logger logger = LoggerFactory.getLogger(DocumentUtils.class);

        if (url == null || url.isEmpty()) {
            logger.error("URL cannot be null or empty");
            return null; // Or return an empty string if preferred
        }

        String normalizedUrl;

        if (url.startsWith("file:")) {
            normalizedUrl = url.substring(5); // Remove "file:" prefix
        } else if (url.startsWith("s3:")) {
            normalizedUrl = url.substring(3); // Remove "s3:" prefix
        } else if (url.startsWith("http:") || url.startsWith("https:")) {
            try {
                // Parse the URL and get the path
                URI uri = new URI(url);
                normalizedUrl = uri.getPath(); // Extract the path component
            } catch (Exception e) {
                logger.error("Invalid HTTP/HTTPS URL format: {}", url, e);
                return null; // Return null for invalid format
            }
        } else {
            logger.error("Unsupported URL format: {}", url);
            return null; // Return null for unsupported formats
        }

        // Ensure normalized URL is not empty after processing
        if (normalizedUrl.isEmpty()) {
            logger.error("The URL path is empty: {}", url);
            return null;
        }

        // Replace backslashes with forward slashes for consistency
        normalizedUrl = normalizedUrl.replace('\\', '/');

        // Extract the file name from the path
        Path path = Paths.get(normalizedUrl);
        return path.getFileName().toString();
    }

    public String extractBaseDomain(String url) {
        try {
            URL parsedUrl = new URL(url);
            return parsedUrl.getProtocol() + "://" + parsedUrl.getHost();
        } catch (MalformedURLException e) {
            logger.error("Invalid URL: {}", url);
            throw new IllegalArgumentException("Invalid URL provided: " + url, e);
        }
    }


}

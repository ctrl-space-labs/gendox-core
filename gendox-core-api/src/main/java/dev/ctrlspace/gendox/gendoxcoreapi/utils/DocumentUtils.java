package dev.ctrlspace.gendox.gendoxcoreapi.utils;

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
import java.net.URI;
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

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    public DocumentUtils(GendoxAPIIntegrationService gendoxAPIIntegrationService,
                         IsccCodeService isccCodeService,
                         MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter) {
        this.gendoxAPIIntegrationService = gendoxAPIIntegrationService;
        this.isccCodeService = isccCodeService;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
    }

    String apiKey = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJDR0NpMlNTX2lQNkdGYTBKQmVqRjAxYzNpcDBTdm43d2FLMGNYQnJHR19RIn0.eyJleHAiOjE3MzI0MDE1NjgsImlhdCI6MTczMjM1ODM2OCwiYXV0aF90aW1lIjoxNzMyMzU4MzY3LCJqdGkiOiJkNDU4MjliZi03YzQ0LTRlMmQtYTZkNS1hOGMxNzk4ZGQzNTUiLCJpc3MiOiJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldi9pZHAvcmVhbG1zL2dlbmRveC1pZHAtZGV2IiwiYXVkIjoiYWNjb3VudCIsInN1YiI6IjEyYjYwNGQ4LTk1OTktNDk3ZS05ZDA4LTAwYjdkZmQ5ZmVkMiIsInR5cCI6IkJlYXJlciIsImF6cCI6ImdlbmRveC1wa2NlLXB1YmxpYy1jbGllbnQtZGV2Iiwic2lkIjoiZTFhM2Y5NDgtZjkzNy00N2NkLWI2M2QtZDRhZjk4OTZhZGY3IiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyJodHRwczovL2Rldi5nZW5kb3guY3RybHNwYWNlLmRldiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1nZW5kb3gtaWRwLWRldiIsIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iXX0sInJlc291cmNlX2FjY2VzcyI6eyJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJBY2NvdW50IG9uZSBUZXN0QWNjb3VudCAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzZWxvbW81MDA5QGV4d2VtZS5jb20iLCJnaXZlbl9uYW1lIjoiQWNjb3VudCBvbmUiLCJmYW1pbHlfbmFtZSI6IlRlc3RBY2NvdW50ICIsImVtYWlsIjoic2Vsb21vNTAwOUBleHdlbWUuY29tIn0.g5q4vjxCo7hv-l_NIEKxetNEvny7nlzmmjWHHZDfXbFekcDLaB9qFLM9oZYDvU2FwmT9rM3lNKORp6nnVw2x6DFfecWo1m0of6Ov5md04onu5OdSvDhYHzcwjROXGX5-8zNJxi65ZIpCBXWJmZdKhAs0pIWdYB6USGFzWkfqUpqtw4UnypUgqckDFVOYLLswfY8fpGYiJnimPvwCy-DLPpVS6Ic97UgwrGSTcievQOielLUokyGGzS6igSJLw93y24ZAwEytt8whPLAeuPqPRUoNrNN2leZK2tAzrpHsso5cPb6SQ-mSGFFbHDBcbdC_1RcGbm7qsHQu_jxv37K2_Q";


    public String getApiIntegrationDocumentTitle(Long contentId, String baseUrl) {
        ContentDTO contentDTO = gendoxAPIIntegrationService.getContentById(baseUrl, contentId, apiKey);
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


}

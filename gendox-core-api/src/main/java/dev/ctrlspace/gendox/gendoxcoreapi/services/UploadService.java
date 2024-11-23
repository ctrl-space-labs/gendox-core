package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Type;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
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
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;


import java.io.*;
import java.util.UUID;

@Service
public class UploadService {

    Logger logger = LoggerFactory.getLogger(UploadService.class);

    // Define the location where you want to save uploaded files
    @Value("${gendox.documents.upload-dir}")
    private String uploadDir;

    private DocumentService documentService;
    private ProjectDocumentService projectDocumentService;
    private AuditLogsService auditLogsService;
    private TypeService typeService;
    private DocumentUtils documentUtils;


    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    public UploadService(DocumentService documentService,
                         ProjectDocumentService projectDocumentService,
                         TypeService typeService,
                         AuditLogsService auditLogsService,
                         DocumentUtils documentUtils) {
        this.documentService = documentService;
        this.projectDocumentService = projectDocumentService;
        this.typeService = typeService;
        this.auditLogsService = auditLogsService;
        this.documentUtils = documentUtils;
    }


    public DocumentInstance uploadFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException, GendoxException {
        String fileName = file.getOriginalFilename();
        String fullFilePath = saveFile(file, organizationId, projectId);

        createAuditLog(organizationId, projectId, "DOCUMENT_CREATE");

        DocumentInstance instance = createDocumentInstance(file, organizationId, fileName, fullFilePath);
        instance = upsertDocumentInstance(projectId, instance);

        return instance;
    }

    private DocumentInstance createDocumentInstance(MultipartFile file, UUID organizationId, String fileName, String fullFilePath) throws IOException, GendoxException {
        DocumentInstance instance = new DocumentInstance();
        instance.setOrganizationId(organizationId);
        instance.setRemoteUrl(fullFilePath);
        instance.setTitle(fileName);
        // TODO @Giannis: This should also take other parameters for document types
        instance.setFileType(typeService.getFileTypeByName("PLAIN_TEXT_FILE"));
        instance.setDocumentIsccCode(documentUtils.getIsccCode(file));
        return instance;
    }

    // TODO 1. merge with Myrto's changes for audit logs, 2. Then move it to the DocumentService
    public DocumentInstance upsertDocumentInstance(UUID projectId, DocumentInstance documentInstance) throws GendoxException {
        DocumentInstance existingInstance =
                documentService.getDocumentByProjectIdAndOrganizationIdAndTitle(projectId, documentInstance);

        if (existingInstance == null) {
            return createNewDocumentInstance(projectId, documentInstance);
        } else {
            return updateExistingDocumentInstance(projectId, documentInstance, existingInstance);
        }

    }


    private DocumentInstance createNewDocumentInstance(UUID projectId, DocumentInstance documentInstance) throws GendoxException {
        UUID documentInstanceId = UUID.randomUUID();
        documentInstance.setId(documentInstanceId);
        DocumentInstance newInstance = documentService.createDocumentInstance(documentInstance);
        projectDocumentService.createProjectDocument(projectId, newInstance.getId());
        return newInstance;
    }

    private DocumentInstance updateExistingDocumentInstance(UUID projectId, DocumentInstance documentInstance, DocumentInstance existingInstance) throws GendoxException {
        documentInstance.setId(existingInstance.getId());
        DocumentInstance updatedInstance = documentService.updateDocument(documentInstance);
        createAuditLog(existingInstance.getOrganizationId(), projectId, "DOCUMENT_UPDATE");
        return updatedInstance;
    }

    private void createAuditLog(UUID organizationId, UUID projectId, String logType) throws GendoxException {
        Type auditLogType = typeService.getAuditLogTypeByName(logType);
        AuditLogs auditLogs = auditLogsService.createDefaultAuditLogs(auditLogType);
        auditLogs.setOrganizationId(organizationId);
        auditLogs.setProjectId(projectId);
        auditLogsService.saveAuditLogs(auditLogs);
    }


    private String saveFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException {
        String fileName = file.getOriginalFilename();
        String cleanFileName = Paths.get(fileName).getFileName().toString();
        String filePathPrefix = organizationId + "/" + projectId;
        String fullFilePath = uploadDir + "/" + filePathPrefix + "/" + cleanFileName;

        Path directoryPath = Paths.get(uploadDir.replaceFirst("^file:", ""), filePathPrefix);
        if (!Files.exists(directoryPath)) {
            Files.createDirectories(directoryPath);
            logger.debug("Created directories at: {}", directoryPath);
        } else {
            logger.debug("Directories already exist at: {}", directoryPath);
        }

        Path filePath = Paths.get(directoryPath.toString(), cleanFileName);
        logger.debug("Attempting to write file at: {}", filePath);


        WritableResource writableResource = (WritableResource) resourceLoader.getResource(fullFilePath);
        try (OutputStream outputStream = writableResource.getOutputStream()) {
            byte[] bytes = file.getBytes();
            outputStream.write(bytes);
        }
        return fullFilePath;
    }


    public void createLocalFileDirectory(String filePath) {
        // Create the directories if they don't exist in the local file system
        if (uploadDir.startsWith("file:")) {
            String basePath = uploadDir.substring(5);
            File folder = new File(basePath, filePath);
            if (!folder.exists()) {
                folder.mkdirs(); // Create the folder and it's parent directories if needed
            }
        }

    }


    @NotNull
    private static String calculateFilePathPrefix(UUID organizationId) {
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

}

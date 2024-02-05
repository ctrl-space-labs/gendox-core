package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.provenAi.utils.IsccCodeServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.MockUniqueIdentifierServiceAdapter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.WritableResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;


import java.io.*;
import java.util.UUID;

@Service
public class UploadService {


    // Define the location where you want to save uploaded files
    @Value("${gendox.documents.upload-dir}")
    private String uploadDir;

    private DocumentService documentService;
    private ProjectDocumentService projectDocumentService;

    private IsccCodeServiceAdapter isccCodeServiceAdapter;

    private MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter;



    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    public UploadService(DocumentService documentService,
                         ProjectDocumentService projectDocumentService,
                         IsccCodeServiceAdapter isccCodeServiceAdapter,
                         MockUniqueIdentifierServiceAdapter mockUniqueIdentifierServiceAdapter
                         ) {
        this.documentService = documentService;
        this.projectDocumentService = projectDocumentService;
        this.isccCodeServiceAdapter = isccCodeServiceAdapter;
        this.mockUniqueIdentifierServiceAdapter = mockUniqueIdentifierServiceAdapter;
    }


    public DocumentInstance uploadFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException, GendoxException {
        String fileName = file.getOriginalFilename();
        DocumentInstance instance =
                documentService.getDocumentByFileName(projectId, organizationId, fileName);
//        UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = isccCodeServiceAdapter.getDocumentUniqueIdentifier(file, fileName);
        UniqueIdentifierCodeResponse uniqueIdentifierCodeResponse = mockUniqueIdentifierServiceAdapter.getDocumentUniqueIdentifier(file, fileName);


        if (instance == null) {
            DocumentInstance documentInstance = new DocumentInstance();
            // Generate a unique UUID
            UUID documentInstanceId = UUID.randomUUID();
            String fullFilePath = saveFile(file, organizationId, projectId);

            documentInstance.setId(documentInstanceId);
            documentInstance.setOrganizationId(organizationId);
            documentInstance.setRemoteUrl(fullFilePath);
//            ISCC code
//            documentInstance.setDocumentIsccCode(uniqueIdentifierCodeResponse.getIscc());
//              Mock Unique Identifier Code: UUID
            documentInstance.setDocumentIsccCode(uniqueIdentifierCodeResponse.getUuid());
            documentInstance = documentService.createDocumentInstance(documentInstance);
            // create project document
            ProjectDocument projectDocument = projectDocumentService.createProjectDocument(projectId, documentInstance.getId());
            return documentInstance;

        } else {
            String fullFilePath = saveFile(file, organizationId, projectId);
            instance.setRemoteUrl(fullFilePath);
//            instance.setDocumentIsccCode(uniqueIdentifierCodeResponse.getIscc());
            instance.setDocumentIsccCode(uniqueIdentifierCodeResponse.getUuid());

            instance = documentService.updateDocument(instance);
        }


        return instance;
    }

    /**
     * It saves the file to the File System
     * It supports local file system and S3 bucket, depending the resource prefix in uploadDir ("file:" or "s3:")
     *
     * @param file
     * @param organizationId //     * @param documentInstanceId
     * @return
     * @throws IOException
     */
    private String saveFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException {
        String fileName = file.getOriginalFilename();
//        String uniqueFileName = documentInstanceId.toString() + "_" + fileName;

//        String filePathPrefix = calculateFilePathPrefix(organizationId);
        String filePathPrefix = organizationId + "/" + projectId;
        String fullFilePath = uploadDir + "/" + filePathPrefix + "/" + fileName;

        createLocalFileDirectory(filePathPrefix);

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

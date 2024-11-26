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
        String fullFilePath = documentUtils.saveFile(file, organizationId, projectId);

        auditLogsService.createAuditLog(organizationId, projectId, "DOCUMENT_CREATE");

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
        auditLogsService.createAuditLog(existingInstance.getOrganizationId(), projectId, "DOCUMENT_UPDATE");
        return updatedInstance;
    }






}

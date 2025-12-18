package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceSectionWithoutDocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.messages.QueueMessageTopicNameConstants;
import dev.ctrlspace.gendox.gendoxcoreapi.messages.postgres.QueueProducerService;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionOrderDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.spring.batch.services.SplitterBatchService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.JobParametersInvalidException;
import org.springframework.batch.core.repository.JobExecutionAlreadyRunningException;
import org.springframework.batch.core.repository.JobInstanceAlreadyCompleteException;
import org.springframework.batch.core.repository.JobRestartException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Operation;


import java.io.IOException;
import java.util.*;

@RestController
public class DocumentController {

    Logger logger = LoggerFactory.getLogger(DocumentController.class);

    @Value("${gendox.documents.allowed.extensions}")
    private String allowedExtensions;

    private DocumentService documentService;
    private DocumentInstanceConverter documentInstanceConverter;
    private DocumentOnlyConverter documentOnlyConverter;
    private UploadService uploadService;
    private SplitFileService splitFileService;
    private DocumentSectionService documentSectionService;
    private DocumentInstanceSectionWithoutDocumentConverter documentInstanceSectionWithoutDocumentConverter;
    private QueueProducerService queueProducerService;

    @Value("${gendox.batch-jobs.document-splitter.job.name}")
    private String documentSplitterJobName;


    @Autowired
    public DocumentController(DocumentService documentService,
                              DocumentInstanceConverter documentInstanceConverter,
                              UploadService uploadService,
                              SplitFileService splitFileService,
                              DocumentSectionService documentSectionService,
                              DocumentInstanceSectionWithoutDocumentConverter documentInstanceSectionWithoutDocumentConverter,
                              DocumentOnlyConverter documentOnlyConverter,
                              QueueProducerService queueProducerService) {
        this.documentService = documentService;
        this.documentInstanceConverter = documentInstanceConverter;
        this.uploadService = uploadService;
        this.splitFileService = splitFileService;
        this.documentSectionService = documentSectionService;
        this.documentInstanceSectionWithoutDocumentConverter = documentInstanceSectionWithoutDocumentConverter;
        this.documentOnlyConverter = documentOnlyConverter;
        this.queueProducerService = queueProducerService;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @GetMapping("/documents/{documentId}")
    @Operation(summary = "Get document by ID",
            description = "Retrieve a document by its unique ID.")
    public DocumentInstance getById(Authentication authentication, @PathVariable UUID documentId) throws GendoxException {


        return documentService.getDocumentInstanceById(documentId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/projects/{projectId}/documents")
    @Operation(summary = "Get all documents",
            description = "Retrieve a list of all documents based on the provided criteria.")
    public Page<DocumentInstanceDTO> getAll(@Valid DocumentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria, pageable);

        // Convert the Page of DocumentInstance to a Page of DocumentDTO using the converter
        Page<DocumentInstanceDTO> documentDTOs = documentInstances.map(document -> documentOnlyConverter.toDTO(document));


        return documentDTOs;
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/projects/{projectId}/documents/search")
    @Operation(summary = "Get all documents",
            description = "Retrieve a list of all documents based on the provided criteria.")
    public Page<DocumentInstanceDTO> getAllByCriteria(@RequestBody DocumentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria, pageable);

        // Convert the Page of DocumentInstance to a Page of DocumentDTO using the converter
        Page<DocumentInstanceDTO> documentDTOs = documentInstances.map(document -> documentOnlyConverter.toDTO(document));


        return documentDTOs;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')")
    @GetMapping("/projects/{projectId}/documents/sections")
    @Operation(summary = "Get document sections by project ID",
            description = "Fetch a list of document sections associated with a particular project based on the provided project ID. " +
                    "Document sections provide structured content within a project, such as chapters, sections, or segments. " +
                    "This operation enables you to access the sections within the specified project.")
    public List<DocumentInstanceSection> getSectionsByProjectId(Authentication authentication, @PathVariable UUID projectId) throws GendoxException {

        return documentSectionService.getProjectSections(projectId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @GetMapping("/documents/{documentId}/sections")
    @Operation(summary = "Get document sections by document ID",
            description = "Fetch a list of document sections associated with a particular document based on the provided document ID. " +
                    "Document sections provide structured content within a project, such as chapters, sections, or segments. " +
                    "This operation enables you to access the sections within the specified document.")
    public List<DocumentInstanceSection> getSectionsByDocumentId(Authentication authentication, @PathVariable UUID documentId) throws GendoxException {

        return documentSectionService.getSectionsByDocument(documentId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/projects/{projectId}/documents")
    @Operation(summary = "Create a new document",
            description = "Create a new document based on the provided document details. " +
                    "This operation creates a new document instance with associated sections and metadata, " +
                    "incorporating the provided document information.")
    public DocumentInstance create(@RequestBody DocumentInstanceDTO documentInstanceDTO, @PathVariable UUID organizationId) throws GendoxException, IOException {

        if (documentInstanceDTO.getId() != null) {
            throw new GendoxException("DOCUMENT_INSTANCE_ID_MUST_BE_NULL", "Document instant id is not null", HttpStatus.BAD_REQUEST);
        }

        DocumentInstance documentInstance = documentInstanceConverter.toEntity(documentInstanceDTO);

        if (!organizationId.equals(documentInstanceDTO.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization ID in path and Organization ID in body are not the same", HttpStatus.BAD_REQUEST);
        }


        documentInstance = documentService.createDocumentInstance(documentInstance);

        return documentInstance;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @PostMapping("/documents/{documentId}/sections")
    @Operation(summary = "Create a new document section",
            description = "Create a new document section based on the provided section details. " +
                    "This operation creates a new section instance with associated metadata, " +
                    "incorporating the provided section information.")
    public DocumentInstanceSection createSection(@PathVariable UUID documentId) throws GendoxException {
        DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentId);
        DocumentInstanceSection newSection = new DocumentInstanceSection();
        newSection = documentSectionService.createNewSection(documentInstance);

        return newSection;

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @PutMapping("/documents/{documentId}")
    @Operation(summary = "Update document by ID",
            description = "Update an existing document by specifying its unique ID and providing updated document details. " +
                    "This operation allows you to modify the document's properties, sections, and metadata. " +
                    "Ensure that the ID in the path matches the ID in the provided document details.")
    public DocumentInstance update(Authentication authentication, @PathVariable UUID documentId, @RequestBody DocumentInstanceDTO documentInstanceDTO) throws GendoxException {
        // TODO: Store the sections. The metadata should be updated only if documentTemplate is empty/null

        // ID Validation checks
        if (!documentId.equals(documentInstanceDTO.getId())) {
            throw new GendoxException("DOCUMENT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }


        DocumentInstance documentInstance = documentInstanceConverter.toEntity(documentInstanceDTO);
        documentInstance = documentService.updateDocument(documentInstance);
        return documentInstance;
    }


    // CRUD Sections

    //update section with DocumentInstanceSectionDTO request body
    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @PutMapping("/documents/{documentId}/sections/{sectionId}")
    @Operation(summary = "Update document section by ID",
            description = "Update an existing document section by specifying its unique ID and providing updated section details. " +
                    "This operation allows you to modify the section's properties and metadata. " +
                    "Ensure that the ID in the path matches the ID in the provided section details.")
    public DocumentInstanceSection updateSection(Authentication authentication, @PathVariable UUID sectionId, @PathVariable UUID documentId, @RequestBody DocumentInstanceSectionDTO sectionDTO) throws GendoxException {

//        if (!securityUtils.can("OP_WRITE_DOCUMENT",
//                (GendoxAuthenticationToken) authentication,
//                AccessCriteria.builder()
//                        .orgIds(
//                                Set.of(sectionDTO
//                                        .getDocumentDTO()
//                                        .getOrganizationId()
//                                        .toString()))
//                        .build())) {
//            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
//        }

        DocumentInstanceSection documentSection = documentInstanceSectionWithoutDocumentConverter.toEntity(sectionDTO);
        DocumentInstance documentInstance = documentInstanceConverter.toEntity(sectionDTO.getDocumentInstanceDTO());
        documentSection.setDocumentInstance(documentInstance);

        if (!sectionId.equals(documentSection.getId())) {
            throw new GendoxException("DOCUMENT_SECTION_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        if (!documentId.equals(documentSection.getDocumentInstance().getId())) {
            throw new GendoxException("DOCUMENT_ID_MISMATCH", "Document ID in path and Document ID in body are not the same", HttpStatus.BAD_REQUEST);
        }


        documentSection = documentSectionService.updateSection(documentSection);

        return documentSection;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @PutMapping("/documents/{documentId}/sections-order")
    @Operation(summary = "Update document sections order",
            description = "Update the order of document sections by specifying the document ID and providing the updated order of sections. " +
                    "This operation allows you to modify the order of the sections within the document. " +
                    "Ensure that the ID in the path matches the ID in the provided section details.")
    public void updateSectionsOrder(Authentication authentication, @PathVariable UUID documentId, @RequestBody List<DocumentInstanceSectionOrderDTO> sectionsOrder) throws GendoxException {
        documentSectionService.updateSectionsOrder(sectionsOrder);

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @DeleteMapping("/organizations/{organizationId}/projects/{projectId}/documents/{documentId}")
    @Operation(summary = "Delete document by ID",
            description = "Delete an existing document by specifying its unique ID. " +
                    "This operation permanently removes the document and its associated sections and metadata.")
    public void delete(@PathVariable UUID documentId,
                       @PathVariable UUID projectId) throws GendoxException {
        documentService.deleteDocument(documentId, projectId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedDocumentIdFromPathVariable')")
    @DeleteMapping("/documents/{documentId}/sections/{sectionId}")
    @Operation(summary = "Delete document section by ID",
            description = "Delete an existing document section by specifying its unique ID. " +
                    "This operation permanently removes the section and its associated metadata.")
    public void deleteSection(@PathVariable UUID sectionId) throws GendoxException {
        DocumentInstanceSection documentSection = documentSectionService.getSectionById(sectionId);
        documentSectionService.deleteSection(documentSection);

    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/projects/{projectId}/documents/upload")
    @Operation(summary = "Upload documents",
            description = "Upload one or more documents to the system. " +
                    "The allowed file extensions are defined in the application properties. " +
                    "The uploaded files are associated with a specific organization and project.")
    public ResponseEntity<Map<String, Object>> handleFilesUpload(@RequestParam("file") List<MultipartFile> files,
                                                                 @PathVariable UUID organizationId,
                                                                 @PathVariable UUID projectId)
            throws IOException, GendoxException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {

        // Get the allowed file extensions from application.properties
        List<String> allowedExtensionsList = Arrays.asList(allowedExtensions.split(","));

        validateHasFiles(files);
        validateFileExtensions(files, allowedExtensionsList);
        files.removeIf(MultipartFile::isEmpty);

        List<DocumentInstance> uploadedDocumentInstances = new ArrayList<>();
        for (MultipartFile file : files) {
            DocumentInstance uploaded = uploadService.uploadFile(file, organizationId, projectId);
            uploadedDocumentInstances.add(uploaded);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Files uploaded successfully");

        DocumentCriteria documentCriteria = DocumentCriteria
                .builder()
                .documentInstanceIds(uploadedDocumentInstances.stream().map(d -> String.valueOf(d.getId())).toList())
                .projectId(projectId.toString())
                .build();
        queueProducerService.convertAndSend(QueueMessageTopicNameConstants.DOCUMENT_UPLOAD, documentCriteria, Map.of());
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/projects/{projectId}/documents/upload-single")
    @Operation(summary = "Upload a single document file",
            description = "Upload a single file and return the created or updated DocumentInstance.")
    public ResponseEntity<DocumentInstance> uploadSingleFile(@RequestParam("file") MultipartFile file,
                                                             @PathVariable UUID organizationId,
                                                             @PathVariable UUID projectId)
            throws IOException, GendoxException, JobInstanceAlreadyCompleteException, JobExecutionAlreadyRunningException, JobParametersInvalidException, JobRestartException {


        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        DocumentInstance documentInstance = uploadService.uploadFile(file, organizationId, projectId);

        DocumentCriteria documentCriteria = DocumentCriteria
                .builder()
                .documentInstanceIds(List.of(String.valueOf(documentInstance.getId())))
                .projectId(projectId.toString())
                .build();
        queueProducerService.convertAndSend("jobs."+documentSplitterJobName, documentCriteria, Map.of());

        return ResponseEntity.ok(documentInstance);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/projects/{projectId}/documents/split")
    @Operation(summary = "",
            description = " ")
    public List<DocumentInstanceSection> handleFileSplitter(@Valid DocumentCriteria criteria) throws IOException, GendoxException {
        List<DocumentInstanceSection> documentInstanceSections = new ArrayList<>();

        Map<DocumentInstance, List<String>> contentSections = splitFileService.splitDocuments(criteria);
        for (Map.Entry<DocumentInstance, List<String>> entry : contentSections.entrySet()) {
            DocumentInstance documentInstance = entry.getKey();
            List<String> sectionContent = entry.getValue();

            List<DocumentInstanceSection> sections = documentSectionService.createSections(documentInstance, sectionContent);
            documentInstanceSections.addAll(sections);
        }

        return documentInstanceSections;
    }

    private static void validateHasFiles(List<MultipartFile> files) throws GendoxException {
        if (files.isEmpty()) {
            // Handle the case where no files are provided
            throw new GendoxException("NO_FILES_PROVIDED", "No files provided", HttpStatus.BAD_REQUEST);
        }
    }

    private static List<String> getEmptyFileNames(List<MultipartFile> files) {
        List<String> emptyFiles = new ArrayList<>();
        //add empty files to the 'emptyFiles' list
        files.stream()
                .filter(MultipartFile::isEmpty)
                .forEach(file -> emptyFiles.add(file.getOriginalFilename()));
        return emptyFiles;
    }

    private void validateFileExtensions(List<MultipartFile> files, List<String> allowedExtensionsList) throws GendoxException {
        // Check if the file extension is allowed
        for (MultipartFile file : files) {
            String fileExtension = getFileExtension(file.getOriginalFilename());
            if (!allowedExtensionsList.contains(fileExtension)) {
                throw new GendoxException("FILE_EXTENSION_NOT_ALLOWED",
                        "Unsupported file format. Please upload files in one of the following formats: " + allowedExtensions,
                        HttpStatus.BAD_REQUEST); // 400 Bad Request
            }
        }
    }

    // Helper method to extract file extension from filename
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex >= 0) {
            return filename.substring(lastDotIndex);
        }
        return "";
    }

}


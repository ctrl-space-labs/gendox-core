package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentInstanceSectionConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.authentication.UserProfile;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.AccessCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private DocumentOnlyConverter documentOnlyConverter;
    private DocumentConverter documentConverter;
    private UploadService uploadService;
    private SplitFileService splitFileService;
    private DocumentSectionService documentSectionService;
    private DocumentInstanceSectionConverter documentInstanceSectionConverter;

    private SecurityUtils securityUtils;


    @Autowired
    public DocumentController(DocumentService documentService,
                              DocumentOnlyConverter documentOnlyConverter,
                              DocumentConverter documentConverter,
                              UploadService uploadService,
                              SplitFileService splitFileService,
                              SecurityUtils securityUtils,
                              DocumentSectionService documentSectionService,
                              DocumentInstanceSectionConverter documentInstanceSectionConverter) {
        this.documentService = documentService;
        this.documentOnlyConverter = documentOnlyConverter;
        this.documentConverter = documentConverter;
        this.uploadService = uploadService;
        this.splitFileService = splitFileService;
        this.documentSectionService = documentSectionService;
        this.securityUtils = securityUtils;
        this.documentInstanceSectionConverter = documentInstanceSectionConverter;
    }


    @GetMapping("/documents/{documentId}")
    @Operation(summary = "Get document by ID",
            description = "Retrieve a document by its unique ID.")
    public DocumentInstance getById(Authentication authentication, @PathVariable UUID documentId) throws GendoxException {

        DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentId);

        if (!securityUtils.can("OP_READ_DOCUMENT",
                (GendoxAuthenticationToken) authentication,
                AccessCriteria.builder()
                        .orgIds(
                                Set.of(documentInstance
                                        .getOrganizationId()
                                        .toString()))
                        .build())) {
            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
        }



        return documentInstance;
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_READ_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @GetMapping("/organizations/{organizationId}/projects/{projectId}/documents")
    @Operation(summary = "Get all documents",
            description = "Retrieve a list of all documents based on the provided criteria.")
    public Page<DocumentDTO> getAll(@Valid DocumentCriteria criteria, Pageable pageable) throws GendoxException {
        if (pageable == null) {
            pageable = PageRequest.of(0, 100);
        }
        if (pageable.getPageSize() > 100) {
            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
        }

        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria, pageable);

        // Convert the Page of DocumentInstance to a Page of DocumentDTO using the converter
        Page<DocumentDTO> documentDTOs = documentInstances.map(document -> documentOnlyConverter.toDTO(document));


        return documentDTOs;
    }



    @GetMapping("/projects/{projectId}/documents/sections")
    @Operation(summary = "Get document sections by project ID",
            description = "Fetch a list of document sections associated with a particular project based on the provided project ID. " +
                    "Document sections provide structured content within a project, such as chapters, sections, or segments. " +
                    "This operation enables you to access the sections within the specified project.")
    public List<DocumentInstanceSection> getSectionsByProjectId(Authentication authentication, @PathVariable UUID projectId) throws GendoxException {

        if (!securityUtils.can("OP_READ_DOCUMENT",
                (GendoxAuthenticationToken) authentication,
                AccessCriteria.builder()
                        .projectIds(
                                Set.of(projectId
                                        .toString()))
                        .build())) {
            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
        }

        return documentSectionService.getProjectSections(projectId);
    }


    @GetMapping("/documents/{documentId}/sections")
    @Operation(summary = "Get document sections by document ID",
            description = "Fetch a list of document sections associated with a particular document based on the provided document ID. " +
                    "Document sections provide structured content within a project, such as chapters, sections, or segments. " +
                    "This operation enables you to access the sections within the specified document.")
    public List<DocumentInstanceSection> getSectionsByDocumentId(Authentication authentication, @PathVariable UUID documentId) throws GendoxException {

        DocumentInstance documentInstance = documentService.getDocumentInstanceById(documentId);

        if (!securityUtils.can("OP_READ_DOCUMENT",
                (GendoxAuthenticationToken) authentication,
                AccessCriteria.builder()
                        .orgIds(
                                Set.of(documentInstance
                                        .getOrganizationId()
                                        .toString()))
                        .build())) {
            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
        }

        return documentSectionService.getSectionsByDocument(documentId);
    }


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("/organizations/{organizationId}/projects/{projectId}/documents")
    @Operation(summary = "Create a new document",
            description = "Create a new document based on the provided document details. " +
                    "This operation creates a new document instance with associated sections and metadata, " +
                    "incorporating the provided document information.")
    public DocumentInstance create(@RequestBody DocumentDTO documentDTO, @PathVariable UUID organizationId) throws GendoxException {

        if (documentDTO.getId() != null) {
            throw new GendoxException("DOCUMENT_INSTANCE_ID_MUST_BE_NULL", "Document instant id is not null", HttpStatus.BAD_REQUEST);
        }

        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);

        if (!organizationId.equals(documentDTO.getOrganizationId())) {
            throw new GendoxException("ORGANIZATION_ID_MISMATCH", "Organization ID in path and Organization ID in body are not the same", HttpStatus.BAD_REQUEST);
        }


        documentInstance = documentService.createDocumentInstance(documentInstance);

        return documentInstance;
    }


//    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
//            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PutMapping("/documents/{documentId}")
    @Operation(summary = "Update document by ID",
            description = "Update an existing document by specifying its unique ID and providing updated document details. " +
                    "This operation allows you to modify the document's properties, sections, and metadata. " +
                    "Ensure that the ID in the path matches the ID in the provided document details.")
    public DocumentInstance update(Authentication authentication, @PathVariable UUID documentId,  @RequestBody DocumentDTO documentDTO) throws GendoxException {
        // TODO: Store the sections. The metadata should be updated only if documentTemplate is empty/null

        // Authorize check
        if (!securityUtils.can("OP_WRITE_DOCUMENT",
                (GendoxAuthenticationToken) authentication,
                AccessCriteria.builder()
                        .orgIds(
                                Set.of(documentDTO
                                        .getOrganizationId()
                                        .toString()))
                        .build())) {
            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
        }

        // ID Validation checks
        if (!documentId.equals(documentDTO.getId())) {
            throw new GendoxException("DOCUMENT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }


        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);
        documentInstance = documentService.updateDocument(documentInstance);
        return documentInstance;
    }


    // CRUD Sections

    //update section with DocumentInstanceSectionDTO request body
    @PutMapping("/documents/{documentId}/sections/{sectionId}")
    @Operation(summary = "Update document section by ID",
            description = "Update an existing document section by specifying its unique ID and providing updated section details. " +
                    "This operation allows you to modify the section's properties and metadata. " +
                    "Ensure that the ID in the path matches the ID in the provided section details.")
    public DocumentInstanceSection updateSection(Authentication authentication, @PathVariable UUID sectionId, @PathVariable UUID documentId, @RequestBody DocumentInstanceSectionDTO sectionDTO) throws GendoxException {

        if (!securityUtils.can("OP_WRITE_DOCUMENT",
                (GendoxAuthenticationToken) authentication,
                AccessCriteria.builder()
                        .orgIds(
                                Set.of(sectionDTO
                                        .getDocumentDTO()
                                        .getOrganizationId()
                                        .toString()))
                        .build())) {
            throw new GendoxException("UNAUTHORIZED", "You are not authorized to perform this operation", HttpStatus.UNAUTHORIZED);
        }

        DocumentInstanceSection documentSection = documentInstanceSectionConverter.toEntity(sectionDTO);
        DocumentInstance documentInstance = documentConverter.toEntity(sectionDTO.getDocumentDTO());
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


    @PreAuthorize("@securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedProjectIdFromPathVariable')" +
            "&& @securityUtils.hasAuthority('OP_WRITE_DOCUMENT', 'getRequestedOrgIdFromPathVariable')")
    @PostMapping("organizations/{organizationId}/projects/{projectId}/documents/upload")
    @Operation(summary = "Upload documents",
            description = "Upload one or more documents to the system. " +
                    "The allowed file extensions are defined in the application properties. " +
                    "The uploaded files are associated with a specific organization and project.")
    public ResponseEntity<Map<String, Object>> handleFilesUpload(@RequestParam("file") List<MultipartFile> files,
                                                                 @PathVariable UUID organizationId,
                                                                 @PathVariable UUID projectId) throws IOException, GendoxException {

        // Get the allowed file extensions from application.properties
        List<String> allowedExtensionsList = Arrays.asList(allowedExtensions.split(","));

        validateHasFiles(files);
        validateFileExtensions(files, allowedExtensionsList);
        files.removeIf(MultipartFile::isEmpty);

        for (MultipartFile file : files) {
            uploadService.uploadFile(file, organizationId, projectId);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Files uploaded successfully");
        return ResponseEntity.ok(response);
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


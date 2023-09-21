package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.*;

@RestController
public class DocumentController {

    @Value("${Gendox.file.allowed.extensions}")
    private String allowedExtensions;

    private DocumentService documentService;
    private DocumentOnlyConverter documentOnlyConverter;
    private DocumentConverter documentConverter;
    private UploadService uploadService;


    @Autowired
    public DocumentController(DocumentService documentService,
                              DocumentOnlyConverter documentOnlyConverter,
                              DocumentConverter documentConverter,
                              UploadService uploadService) {
        this.documentService = documentService;
        this.documentOnlyConverter = documentOnlyConverter;
        this.documentConverter = documentConverter;
        this.uploadService = uploadService;
    }

    @GetMapping("/documents/{id}")
    public DocumentInstance getById(@PathVariable UUID id) throws GendoxException {
        //throw new UnsupportedOperationException("Not implemented yet");
        return documentService.getDocumentInstanceById(id);
    }


    @GetMapping("/documents")
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

    @GetMapping("/documents/sections/projects/{id}")
    public List<DocumentInstanceSection> getSectionsByProjectId(@PathVariable UUID id) throws GendoxException {
        //throw new UnsupportedOperationException("Not implemented yet");
        return documentService.getProjectSections(id);
    }


    @PostMapping("/documents")
    public DocumentInstance create(@RequestBody DocumentDTO documentDTO) throws GendoxException {

        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);
        documentInstance = documentService.createDocumentInstance(documentInstance);

        return documentInstance;
    }


    @PutMapping("/documents/{id}")
    public DocumentInstance update(@PathVariable UUID id, @RequestBody DocumentDTO documentDTO) throws GendoxException {
        // TODO: Store the sections. The metadata should be updated only if documentTemplate is empty/null

        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);

        if (!id.equals(documentInstance.getId())) {
            throw new GendoxException("DOCUMENT_ID_MISMATCH", "ID in path and ID in body are not the same", HttpStatus.BAD_REQUEST);
        }

        documentInstance = documentService.updateDocument(documentInstance);
        return documentInstance;
    }

    @DeleteMapping("/documents/{id}")
    public void delete(@PathVariable UUID id) throws GendoxException {
        documentService.deleteDocument(id);
    }


    @PostMapping("/documents/upload")
    public ResponseEntity<Map<String, Object>> handleFilesUpload(@RequestParam("file") List<MultipartFile> files,
                                                                 @RequestParam("organizationId") UUID organizationId,
                                                                 @RequestParam("projectId") UUID projectId) throws IOException, GendoxException {

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


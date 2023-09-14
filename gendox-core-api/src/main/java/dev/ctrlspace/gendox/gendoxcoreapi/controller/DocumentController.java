package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentOnlyConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UploadService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
public class DocumentController {

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

    // return Entity
//    @GetMapping("/documents")
//    public Page<DocumentInstance> getAll(@Valid DocumentCriteria criteria, Pageable pageable) throws GendoxException {
//        if (pageable == null) {
//            pageable = PageRequest.of(0, 100);
//        }
//        if (pageable.getPageSize() > 100) {
//            throw new GendoxException("MAX_PAGE_SIZE_EXCEED", "Page size can't be more than 100", HttpStatus.BAD_REQUEST);
//
//        }
//
//        return documentService.getAllDocuments(criteria, pageable);
//
//
//    }

    // return DTO
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


    @PostMapping("/documents")
    public DocumentInstance create(@RequestBody DocumentDTO documentDTO) throws GendoxException {
        // TODO: Store the sections and their metadata also

        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);
        documentInstance = documentService.createDocumentInstance(documentInstance);

        return documentInstance;
    }


    @PutMapping("/documents/{id}")
    public DocumentInstance update(@PathVariable UUID id, @RequestBody DocumentDTO documentDTO) throws GendoxException {
        // TODO: Store the sections. The metadata should be updated only if documentTemplate is empty/null
        // TODO: Organization can't be changed

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


    // TODO: upload to S3 using ResourceLoader or Local file system, no amazonS3 library should be used
    // https://cloud.spring.io/spring-cloud-static/spring-cloud-aws/2.0.0.RELEASE/multi/multi__resource_handling.html
    // https://www.baeldung.com/spring-cloud-aws-s3
    // max total upload ~10MB configurable:
    //spring.servlet.multipart.enabled=true
    //spring.servlet.multipart.max-file-size=10MB
    //spring.servlet.multipart.max-request-size=100MB
    // Document section should be created for each file,
    // different strategies should be supported, configurable from the DB
    // https://www.digitalocean.com/community/tutorials/strategy-design-pattern-in-java-example-tutorial

    @PostMapping("/documents/upload")
    public ResponseEntity<Map<String, String>> handleFileUpload(@RequestParam("file") MultipartFile file,
                                                                @RequestParam("organizationId") UUID organizationId,
                                                                @RequestParam("projectId") UUID projectId) {
        Map<String, String> response = new HashMap<>();

        if (!file.isEmpty()) {
            try {
                String fileContent = uploadService.uploadFile(file, organizationId, projectId);

                // File successfully uploaded and content read
                response.put("message", "File uploaded successfully");
                response.put("content", fileContent);
                return ResponseEntity.ok(response); // 200 OK
            } catch (IOException | GendoxException e) {
                // Handle the exception (e.g., log the error or show an error message)
                e.printStackTrace();
                response.put("error", "Failed to upload or read the file: " + e.getMessage());
                return ResponseEntity.status(500).body(response); // 500 Internal Server Error
            }
        } else {
            // Handle the case where the file is empty
            response.put("error", "File is empty");
            return ResponseEntity.badRequest().body(response); // 400 Bad Request
        }
    }


}
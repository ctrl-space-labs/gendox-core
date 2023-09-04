package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.print.Pageable;

@RestController
public class DocumentController {


    @GetMapping("/documents/{id}")
    public DocumentInstance getById(@PathVariable String id) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @GetMapping("/documents")
    public DocumentInstance getAll(DocumentCriteria criteria, Pageable pageable) {
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PostMapping("/documents")
    public DocumentInstance create(@RequestBody DocumentInstance documentInstance) {
        // TODO: Store the sections and their metadata also
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @PutMapping("/documents/{id}")
    public DocumentInstance update(@PathVariable String id, @RequestBody DocumentInstance documentInstance) {
        // TODO: Store the sections. The metadata should be updated only if documentTemplate is empty/null
        // TODO: Organization can't be changed
        throw new UnsupportedOperationException("Not implemented yet");
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<String> delete(@PathVariable String id) {
        throw new UnsupportedOperationException("Not implemented yet");
    }


    @PostMapping("/documents/upload")
    public ResponseEntity<String> handleFileUpload(@RequestParam("files") MultipartFile[] file) {
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

        throw new UnsupportedOperationException("Not implemented yet");
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.S3Object;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceSectionRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentSectionMetadataRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.SecurityUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;


import java.io.*;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class SplitFileService {


    private DocumentService documentService;
    private ResourceLoader resourceLoader;
    private DocumentSectionService documentSectionService;
    private ProjectAgentService projectAgentService;


    @Autowired
    public SplitFileService(DocumentService documentService,
                            ResourceLoader resourceLoader,
                            DocumentSectionService documentSectionService,
                            ProjectAgentService projectAgentService) {
        this.documentService = documentService;
        this.resourceLoader = resourceLoader;
        this.documentSectionService = documentSectionService;
        this.projectAgentService = projectAgentService;
    }


    public List<DocumentInstanceSection> splitDocuments(DocumentCriteria criteria) throws GendoxException, IOException {

        List<DocumentInstanceSection> sections = new ArrayList<>();
        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria);

        for (DocumentInstance documentInstance : documentInstances) {

            String content = readDocumentContent(documentInstance);

            ProjectAgent agent = projectAgentService.getAgentByDocumentId(documentInstance.getId());

            // if there are sections for this document, delete them
            if (documentSectionService.getSectionsByDocument(documentInstance.getId()) != null) {
                documentSectionService.deleteDocumentSections(documentInstance.getId());
            }

            List<DocumentInstanceSection> documentSections = documentSectionService.createSections(documentInstance, content, agent.getId());

            for (DocumentInstanceSection section : documentSections) {
                sections.add(section);
            }

        }
        return sections;
    }



    public String readDocumentContent(DocumentInstance instance) throws GendoxException, IOException{
        // get file
        InputStream inputStream = downloadFile(instance.getRemoteUrl());
        // files content
        String content = readTxtFileContent(inputStream);

        return content;
    }

    private String readTxtFileContent(InputStream inputStream) throws IOException {
        StringBuilder fileContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                fileContent.append(line).append(" \n ");
            }
        }

        return fileContent.toString();
    }


    public InputStream downloadFile(String fileUrl) throws GendoxException {

        try {
            Resource fileResource = resourceLoader.getResource(fileUrl);
            InputStream inputStream = fileResource.getInputStream();
            return inputStream;
        } catch (Exception e) {
            // Handle any exceptions
            throw new GendoxException("ERROR_DOWNLOAD_FILE", "Error downloading file: " + fileUrl, HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }


    // Extract the file name from the URL (e.g., "http://example.com/path/to/file.pdf" -> "file.pdf")
    private String extractFileNameFromUrl(String url) throws GendoxException {
        int lastSlashIndex = url.lastIndexOf("/");
        if (lastSlashIndex >= 0) {
            return url.substring(lastSlashIndex + 1);
        } else {
            throw new GendoxException("ERROR_FILE_NAME", "Error Files name: ", HttpStatus.NOT_FOUND);
        }
    }


}

package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.S3Object;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentSectionMetadata;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SplitFileService {


    private TypeService typeService;
    private ServiceSelector serviceSelector;
    private ProjectAgentRepository projectAgentRepository;
    private DocumentService documentService;
    private ResourceLoader resourceLoader;

    @Autowired
    private AmazonS3 amazonS3;


    @Autowired
    public SplitFileService(TypeService typeService,
                            ServiceSelector serviceSelector,
                            ProjectAgentRepository projectAgentRepository,
                            DocumentService documentService,
                            ResourceLoader resourceLoader) {
        this.typeService = typeService;
        this.serviceSelector = serviceSelector;
        this.projectAgentRepository = projectAgentRepository;
        this.documentService = documentService;
        this.resourceLoader = resourceLoader;
    }


    public List<DocumentInstanceSection> splitDocumentToSections(DocumentCriteria criteria, UUID projectId) throws GendoxException, IOException {

        List<DocumentInstanceSection> sections = new ArrayList<>();
        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria);


        for (DocumentInstance documentInstance : documentInstances) {

            // get file
            InputStream inputStream = downloadFile(documentInstance.getRemoteUrl());

            // files content
            String content = readTxtFileContent(inputStream);

            List<DocumentInstanceSection> documentSections = createSections(documentInstance, content, projectId);

            for (DocumentInstanceSection section : documentSections) {
                sections.add(section);
            }

        }
        return sections;
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
    private String extractFileNameFromUrl(String url) {
        int lastSlashIndex = url.lastIndexOf("/");
        if (lastSlashIndex >= 0) {
            return url.substring(lastSlashIndex + 1);
        } else {
            return "downloaded-file"; // Default file name if extraction fails
        }
    }


    public List<DocumentInstanceSection> createSections(DocumentInstance documentInstance, String fileContent, UUID projectId) throws GendoxException {
        List<DocumentInstanceSection> sections = new ArrayList<>();
        // take the splitters type
        ProjectAgent agent = projectAgentRepository.findByProjectId(projectId);
        String splitterTypeName = agent.getDocumentSplitterType().getName();

        DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);
        if (documentSplitter == null) {
            throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND", "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
        }

        List<String> contentSections = documentSplitter.split(fileContent);

        Integer sectionOrder = 0;
        for (String contentSection : contentSections) {
            sectionOrder++;
            DocumentInstanceSection section = createSection(documentInstance, contentSection, sectionOrder);
            sections.add(section);
        }


        return sections;
    }

    public DocumentInstanceSection createSection(DocumentInstance documentInstance, String fileContent, Integer sectionOrder) throws GendoxException {
        DocumentInstanceSection section = new DocumentInstanceSection();
        // create section's metadata
        DocumentSectionMetadata metadata = new DocumentSectionMetadata();
        metadata.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadata.setTitle("Default Title");
        metadata.setSectionOrder(sectionOrder);

        section.setDocumentSectionMetadata(metadata);
        section.setSectionValue(fileContent);
        section.setDocumentInstance(documentInstance);

        // sava section and metadata
        section = documentService.createSection(section);

        return section;
    }


}

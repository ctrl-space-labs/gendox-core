package dev.ctrlspace.gendox.gendoxcoreapi.services;


import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.criteria.DocumentCriteria;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;


import java.io.*;
import java.util.*;

@Service
public class SplitFileService {


    private DocumentService documentService;
    private DownloadService downloadService;
    private ProjectAgentService projectAgentService;
    private ServiceSelector serviceSelector;


    @Autowired
    public SplitFileService(DocumentService documentService,
                            DownloadService downloadService,
                            ProjectAgentService projectAgentService,
                            ServiceSelector serviceSelector) {
        this.documentService = documentService;
        this.downloadService = downloadService;
        this.projectAgentService = projectAgentService;
        this.serviceSelector = serviceSelector;
    }




    public Map<DocumentInstance, List<String>> splitDocuments(DocumentCriteria criteria) throws GendoxException, IOException {

        Map<DocumentInstance, List<String>> contentSections = new HashMap<>();

        Page<DocumentInstance> documentInstances = documentService.getAllDocuments(criteria);

        for (DocumentInstance documentInstance : documentInstances) {
            List<String> documentContent = splitDocument(documentInstance);

            contentSections.put(documentInstance, documentContent);
        }

        return contentSections;
    }

    public List<String> splitDocument(DocumentInstance documentInstance) throws GendoxException, IOException {
        String fileContent = downloadService.readDocumentContent(documentInstance.getRemoteUrl());

        ProjectAgent agent = projectAgentService.getAgentByDocumentId(documentInstance.getId());

        String splitterTypeName = agent.getDocumentSplitterType().getName();

        DocumentSplitter documentSplitter = serviceSelector.getDocumentSplitterByName(splitterTypeName);
        if (documentSplitter == null) {
            throw new GendoxException("DOCUMENT_SPLITTER_NOT_FOUND", "Document splitter not found with name: " + splitterTypeName, HttpStatus.NOT_FOUND);
        }

        List<String> contentSections = documentSplitter.split(fileContent);

        return contentSections;
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

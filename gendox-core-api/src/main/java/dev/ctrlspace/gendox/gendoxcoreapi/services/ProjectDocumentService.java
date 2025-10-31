package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.DocumentInstanceRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectDocumentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProjectDocumentService {

    private ProjectDocumentRepository projectDocumentRepository;
    private ProjectRepository projectRepository;
    private DocumentInstanceRepository documentInstanceRepository;

    @Autowired
    public ProjectDocumentService(ProjectDocumentRepository projectDocumentRepository,
                                  ProjectRepository projectRepository,
                                  DocumentInstanceRepository documentInstanceRepository) {
        this.projectDocumentRepository = projectDocumentRepository;
        this.projectRepository = projectRepository;
        this.documentInstanceRepository = documentInstanceRepository;
    }

    public ProjectDocument getProjectDocument(UUID documentId, UUID projectId) throws GendoxException {
        return projectDocumentRepository.findByDocumentIdAndProjectId(documentId, projectId)
                .orElseThrow(() -> new GendoxException("PROJECT_DOCUMENT_NOT_FOUND", "Project document not found with documentId: " + documentId + " and projectId: " + projectId, HttpStatus.NOT_FOUND));
    }


    public UUID getProjectIdByDocumentId(UUID documentId) throws GendoxException {
        return projectDocumentRepository.findProjectIdByDocumentId(documentId)
                .orElseThrow(() -> new GendoxException("PROJECT_NOT_FOUND", "Project not found with documentId: " + documentId, HttpStatus.NOT_FOUND));
    }



    public ProjectDocument createProjectDocument(Project project, DocumentInstance documentInstance) {

        ProjectDocument projectDocument = new ProjectDocument();

        projectDocument.setProject(project);
        projectDocument.setDocumentId(documentInstance.getId());

        projectDocument = projectDocumentRepository.save(projectDocument);

        return projectDocument;
    }

    public ProjectDocument createProjectDocument(UUID projectID, UUID documentId) throws GendoxException {
        ProjectDocument projectDocument = new ProjectDocument();
        Project project = new Project();
        project = projectRepository.findById(projectID)
                .orElseThrow(() -> new GendoxException("PROJECT_NOT_FOUND", "Project not found with id: " + projectID, HttpStatus.NOT_FOUND));

        DocumentInstance documentInstance = new DocumentInstance();
        documentInstance = documentInstanceRepository.findDocumentInstanceById(documentId)
                .orElseThrow(() -> new GendoxException("DOCUMENT_NOT_FOUND", "Document not found with id: " + documentId, HttpStatus.NOT_FOUND));


        if ((project != null) && (documentInstance != null)) {
            projectDocument = createProjectDocument(project, documentInstance);
        }
        return projectDocument;

    }

    public void deleteProjectDocument(UUID documentIid, UUID projectId) throws GendoxException {

        projectDocumentRepository.deleteByDocumentIdAndProjectId(documentIid, projectId);
    }


}

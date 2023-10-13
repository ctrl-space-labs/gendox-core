package dev.ctrlspace.gendox.gendoxcoreapi.services;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.DocumentConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectDocument;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentInstanceSectionDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentSectionMetadataDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.ServiceSelector;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.templates.documents.DocumentSplitter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;


import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UploadService {

    // Define the S3 bucket path
    @Value("${s3.bucket.name}")
    private String s3BucketPath;

    // Define the location where you want to save uploaded files
    @Value("${gendox.file.location}")
    private String location;

    private DocumentService documentService;
    private DocumentConverter documentConverter;
    private TypeService typeService;
    private ProjectDocumentService projectDocumentService;
    private ServiceSelector serviceSelector;
    private ProjectAgentRepository projectAgentRepository;


    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    public UploadService(DocumentService documentService,
                         DocumentConverter documentConverter,
                         TypeService typeService,
                         ProjectDocumentService projectDocumentService,
                         ServiceSelector serviceSelector,
                         ProjectAgentRepository projectAgentRepository) {
        this.documentService = documentService;
        this.documentConverter = documentConverter;
        this.typeService = typeService;
        this.projectDocumentService = projectDocumentService;
        this.serviceSelector = serviceSelector;
        this.projectAgentRepository = projectAgentRepository;
    }


    public String uploadFile(MultipartFile file, UUID organizationId, UUID projectId) throws IOException, GendoxException {
        // Generate a unique file name to avoid conflicts
        String fileName = file.getOriginalFilename();
        UUID documentInstanceId = UUID.randomUUID();
        String uniqueFileName = documentInstanceId.toString() + "_" + fileName;
        String localFilePath = createLocalFilePath(uniqueFileName, organizationId);

        // Save the file to the local location
        try (OutputStream localOutputStream = new FileOutputStream(localFilePath)) {
            byte[] bytes = file.getBytes();
            localOutputStream.write(bytes);
        }

//        // Save the file to the S3 bucket
//        String s3FilePath = s3BucketPath + "/" + uniqueFileName;
//        WritableResource s3Resource = (WritableResource) resourceLoader.getResource(s3FilePath);
//        try (OutputStream s3OutputStream = s3Resource.getOutputStream()) {
//            byte[] bytes = file.getBytes();
//            s3OutputStream.write(bytes);
//        }

        // files content
        String content = readTxtFileContent(new File(localFilePath));

        // create DTOs
        DocumentDTO instanceDTO = createInstanceDTO(documentInstanceId, organizationId, localFilePath);
        List<DocumentInstanceSectionDTO> sectionDTOs = createSectionDTOs(instanceDTO, content, projectId);

        // create document
        DocumentInstance instance = createFileDocument(instanceDTO, sectionDTOs);

        ProjectDocument projectDocument = new ProjectDocument();
        projectDocument = projectDocumentService.createProjectDocument(projectId, instance.getId());


        return content;
    }


    private String readTxtFileContent(File file) throws IOException {
        StringBuilder fileContent = new StringBuilder();

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                fileContent.append(line).append(" \n ");
            }
        }

        return fileContent.toString();
    }


    public String createLocalFilePath(String fileName, UUID organizationId) {
        // Get the current date
        LocalDate currentDate = LocalDate.now();

        // Format the date components
        String year = String.valueOf(currentDate.getYear());
        String month = String.format("%02d", currentDate.getMonthValue()); // Zero-padded month
        String day = String.format("%02d", currentDate.getDayOfMonth());   // Zero-padded day

        // Construct the folder structure
        String folderStructure = organizationId.toString() + File.separator + year + File.separator + month + File.separator + day;
        // Create the directories if they don't exist
        File folder = new File(location, folderStructure);
        if (!folder.exists()) {
            folder.mkdirs(); // Create the folder and it's parent directories if needed
        }

        // Construct the localFilePath
        String localFilePath = new File(folder, fileName).getPath();

        return localFilePath;
    }


    public DocumentInstance createFileDocument(DocumentDTO documentDTO, List<DocumentInstanceSectionDTO> sectionDTO) throws GendoxException {
        documentDTO.setDocumentInstanceSections(sectionDTO);
        DocumentInstance documentInstance = documentConverter.toEntity(documentDTO);
        documentInstance = documentService.createDocumentInstance(documentInstance);
        return documentInstance;

    }


    public DocumentDTO createInstanceDTO(UUID documentInstanceId, UUID organizationId, String location) throws GendoxException {
        DocumentDTO instanceDTO = new DocumentDTO();
        instanceDTO.setId(documentInstanceId);
        instanceDTO.setUserId(documentService.getUserId());
        instanceDTO.setOrganizationId(organizationId);
        instanceDTO.setRemoteUrl(location);
        return instanceDTO;
    }


    public List<DocumentInstanceSectionDTO> createSectionDTOs(DocumentDTO documentDTO, String fileContent, UUID projectId) throws GendoxException{
        List<DocumentInstanceSectionDTO> sectionDTOS = new ArrayList<>();
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
            DocumentInstanceSectionDTO sectionDTO = createSectionDTO(documentDTO, contentSection, sectionOrder);
            sectionDTOS.add(sectionDTO);
        }

        return sectionDTOS;
    }

    public DocumentInstanceSectionDTO createSectionDTO(DocumentDTO documentDTO, String fileContent, Integer sectionOrder) {
        DocumentInstanceSectionDTO sectionDTO = new DocumentInstanceSectionDTO();
        DocumentSectionMetadataDTO metadataDTO = createMetadataDTO(sectionOrder);
        sectionDTO.setDocumentSectionMetadata(metadataDTO);
        sectionDTO.setSectionValue(fileContent);

        return sectionDTO;
    }

    public DocumentSectionMetadataDTO createMetadataDTO(Integer sectionOrder) {
        DocumentSectionMetadataDTO metadataDTO = new DocumentSectionMetadataDTO();

        // Default metadata
        metadataDTO.setDocumentSectionTypeId(typeService.getDocumentTypeByName("FIELD_TEXT").getId());
        metadataDTO.setTitle("Default Title");
        metadataDTO.setSectionOrder(sectionOrder);

        return metadataDTO;
    }
}


















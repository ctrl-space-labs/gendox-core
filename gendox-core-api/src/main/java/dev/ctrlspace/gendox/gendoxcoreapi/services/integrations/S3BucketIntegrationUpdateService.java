package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import com.amazonaws.services.sqs.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.IntegratedFileDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.ProjectIntegrationDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DownloadService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration.ResourceMultipartFile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration.SQSService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.constants.S3BucketIntegrationConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class S3BucketIntegrationUpdateService implements IntegrationUpdateService {

    Logger logger = LoggerFactory.getLogger(S3BucketIntegrationUpdateService.class);

    private SQSService sqsService;
    private DownloadService downloadService;
    private DocumentService documentService;
    private ProjectService projectService;
    private DocumentSectionService documentSectionService;

    @Autowired
    public S3BucketIntegrationUpdateService(SQSService sqsService,
                                            DownloadService downloadService,
                                            DocumentService documentService,
                                            ProjectService projectService,
                                            DocumentSectionService documentSectionService) {
        this.sqsService = sqsService;
        this.downloadService = downloadService;
        this.documentService = documentService;
        this.projectService = projectService;
        this.documentSectionService = documentSectionService;
    }


    @Override
    public Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> checkForUpdates(Integration integration) throws GendoxException {
        logger.info("Checking for updates for Integration ID: {}", integration.getId());

        String queueName = integration.getQueueName();
        List<MultipartFile> fileList = new ArrayList<>();
        List<Message> sqsMessages = sqsService.receiveMessages(queueName);

        for (Message sqsMessage : sqsMessages) {
            try {
                processSqsMessage(sqsMessage, fileList, integration);
                sqsService.deleteMessage(sqsMessage, queueName);
            } catch (Exception e) {
                logger.warn("An error occurred while checking for updates: " + e.getMessage(), e);

            }
        }

        return createMap(fileList, integration);
    }


    private void processSqsMessage(Message sqsMessage, List<MultipartFile> fileList, Integration integration) throws IOException, GendoxException {

//        ObjectMapper objectMapper = new ObjectMapper();
//        JsonNode rootNode = objectMapper.readTree(sqsMessage.getBody());
        JsonNode messageBody = new ObjectMapper().readTree(sqsMessage.getBody());

        String event = extractJsonValue(messageBody, S3BucketIntegrationConstants.OBJECT_ROOT_EVENT);
        String bucketName = extractJsonValue(messageBody, S3BucketIntegrationConstants.OBJECT_ROOT_BUCKET_NAME);
        String objectKey = extractJsonValue(messageBody, S3BucketIntegrationConstants.OBJECT_ROOT_KEY);

        if (S3BucketIntegrationConstants.EVENT_PUT_DOCUMENT.equals(event)) {
            logger.info("Detected file upload event for objectKey: {}", objectKey);
            fileList.add(convertToMultipartFile(bucketName, objectKey));
        } else if (S3BucketIntegrationConstants.EVENT_DELETE_DOCUMENT.equals(event)) {
            logger.info("Detected file deletion event for objectKey: {}", objectKey);
            handleFileDeletion(integration, objectKey);
        } else {
            logger.warn("Unhandled event type: {} in message: {}", event, sqsMessage.getBody());
        }


//        String event = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_EVENT).asText();
//        String bucketName = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_BUCKET_NAME).asText();
//        String objectKey = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_KEY).asText();

//        if (event.equals(S3BucketIntegrationConstants.EVENT_PUT_DOCUMENT)) {
//            logger.info("Detected file upload event for objectKey: {}", objectKey);
//            MultipartFile multipartFile = convertToMultipartFile(bucketName, objectKey);
//            fileList.add(multipartFile);
//        } else if (event.equals(S3BucketIntegrationConstants.EVENT_DELETE_DOCUMENT)) {
//            logger.debug("Deleted file from S3 bucket");
//            handleDeletedDocuments(integration, objectKey);
//        }

    }


    private MultipartFile convertToMultipartFile(String bucketName, String objectKey) throws GendoxException, IOException {
        String encodedFilename = objectKey;
        String originalFilename = URLDecoder.decode(encodedFilename, StandardCharsets.UTF_8.toString());
        // Remove any directory from the filename (keep only the file name)

        String s3Url = "s3://" + bucketName + "/" + originalFilename;
        String content = downloadService.readDocumentContent(s3Url);
        byte[] contentBytes = content.getBytes();

        return new ResourceMultipartFile(
                contentBytes,
                originalFilename,
                "application/octet-stream"
        );
    }

//    private MultipartFile convertToMultipartFile(String bucketName, String objectKey) throws GendoxException, IOException {
//        String decodedFileName = decodeObjectKey(objectKey);
//        logger.debug("Decoded filename for objectKey {}: {}", objectKey, decodedFileName);
//
//        String s3Url = String.format("s3://%s/%s", bucketName, decodedFileName);
//        String fileContent = downloadService.readDocumentContent(s3Url);
//
//        return new ResourceMultipartFile(
//                fileContent.getBytes(StandardCharsets.UTF_8),
//                decodedFileName,
//                "application/octet-stream"
//        );
//    }


    private void handleFileDeletion(Integration integration, String objectKey) throws GendoxException {
        String fileName = objectKey.substring(objectKey.lastIndexOf('/') + 1);
        Project project = projectService.getProjectById(integration.getProjectId());
        DocumentInstance documentInstance = documentService.getDocumentByFileName(project.getId(), project.getOrganizationId(), fileName);
        List<DocumentInstanceSection> documentInstanceSections = documentSectionService.getSectionsByDocument(documentInstance.getId());
        documentInstance.setDocumentInstanceSections(documentInstanceSections);
        documentService.deleteDocument(documentInstance, project.getId());
    }

    private Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> createMap(List<MultipartFile> fileList, Integration integration) {
        Map<ProjectIntegrationDTO, List<IntegratedFileDTO>> map = new HashMap<>();
        ProjectIntegrationDTO projectIntegrationDTO = ProjectIntegrationDTO.builder()
                .projectId(integration.getProjectId())
                .integration(integration)
                .build();
        var integratedFilesDTO = fileList
                .stream()
                .map(file -> IntegratedFileDTO.builder()
                        .multipartFile(file)
                        .build())
                .toList();

//        List<IntegratedFileDTO> integratedFiles = fileList.stream()
//                .map(file -> IntegratedFileDTO.builder().multipartFile(file).build())
//                .collect(Collectors.toList());

        map.put(projectIntegrationDTO, integratedFilesDTO);
        return map;
    }

    private String extractJsonValue(JsonNode rootNode, String jsonPath) throws GendoxException {
        JsonNode valueNode = rootNode.at(jsonPath);
        if (valueNode.isMissingNode() || valueNode.asText().isEmpty()) {
            throw new GendoxException("INVALID_JSON", "Missing or empty value for path: " + jsonPath, HttpStatus.NOT_FOUND );
        }
        return valueNode.asText();
    }

    private String decodeObjectKey(String objectKey) {
        return URLDecoder.decode(objectKey, StandardCharsets.UTF_8);
    }

    private String extractFileName(String objectKey) {
        return Paths.get(objectKey).getFileName().toString();
    }

}





package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import com.amazonaws.services.sqs.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
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
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

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

    /**
     * Checks for updates in the specified integration.
     * Retrieves messages from SQS and processes them accordingly.
     *
     * @param integration The integration to check for updates.
     * @return A list of multipart files representing the updated documents.
     */
//    @Override
//    public List<MultipartFile> checkForUpdates(Integration integration) {
//
//        String queueName = integration.getQueueName();
//        List<MultipartFile> fileList = new ArrayList<>();
//
//        List<Message> sqsMessages = sqsService.receiveMessages(queueName);
//
//        for (Message sqsMessage : sqsMessages) {
//            try {
//                handleSqsMessage(sqsMessage, fileList, integration);
//                sqsService.deleteMessage(sqsMessage, queueName);
//            } catch (Exception e) {
//                logger.error("An error occurred while checking for updates: " + e.getMessage(), e);
//            }
//        }
//
//        return fileList;
//    }
    @Override
    public List<MultipartFile> checkForUpdates(Integration integration) {
        String queueName = integration.getQueueName();
        List<MultipartFile> fileList = new ArrayList<>();

        List<Message> sqsMessages;

        do {
            sqsMessages = sqsService.receiveMessages(queueName);

            if (sqsMessages.isEmpty()) {
                logger.debug("There are no more messages in the queue: {}", queueName);
                break;
            }

            for (Message sqsMessage : sqsMessages) {
                try {
                    handleSqsMessage(sqsMessage, fileList, integration);
                    sqsService.deleteMessage(sqsMessage, queueName);
                } catch (Exception e) {
                    logger.error("An error occurred while checking for updates: " + e.getMessage(), e);

                }
            }

            // Log the number of processed messages
            logger.debug("Processed {} messages from the queue: {}", sqsMessages.size(), queueName);

        } while (!sqsMessages.isEmpty());

        return fileList;
    }

    /**
     * Handles a single SQS message received from the integration queue.
     * Parses the message and takes appropriate actions based on the event.
     *
     * @param sqsMessage  The SQS message to handle.
     * @param fileList    The list to store updated multipart files.
     * @param integration The integration associated with the message.
     */
    private void handleSqsMessage(Message sqsMessage, List<MultipartFile> fileList, Integration integration) throws IOException, GendoxException {

        ObjectMapper objectMapper = new ObjectMapper();
        JsonNode rootNode = objectMapper.readTree(sqsMessage.getBody());

        String event = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_EVENT).asText();
        String bucketName = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_BUCKET_NAME).asText();
        String objectKey = rootNode.at(S3BucketIntegrationConstants.OBJECT_ROOT_KEY).asText();

        if (event.equals(S3BucketIntegrationConstants.EVENT_PUT_DOCUMENT)) {
            logger.debug("Upload file from S3 bucket");
            MultipartFile multipartFile = convertToMultipartFile(bucketName, objectKey);
            fileList.add(multipartFile);
        } else if (event.equals(S3BucketIntegrationConstants.EVENT_DELETE_DOCUMENT)) {
            logger.debug("Deleted file from S3 bucket");
            handleDeletedDocuments(integration, objectKey);
        }

    }

    /**
     * Converts a file from an S3 bucket to a multipart file.
     *
     * @param bucketName The name of the S3 bucket.
     * @param objectKey  The key of the object in the S3 bucket.
     * @return The multipart file representing the content of the S3 object.
     */
    private MultipartFile convertToMultipartFile(String bucketName, String objectKey) throws GendoxException, IOException {
        String encodedFilename = objectKey;
        String originalFilename = URLDecoder.decode(encodedFilename, StandardCharsets.UTF_8.toString());
        String s3Url = "s3://" + bucketName + "/" + originalFilename;
        Resource s3FileResource = downloadService.openResource(s3Url);

        return new ResourceMultipartFile(
                s3FileResource,
                originalFilename,
                "application/octet-stream"
        );
    }

    /**
     * Deletes a document from the database based on the integration information and object key.
     *
     * @param integration The integration associated with the document.
     * @param objectKey   The key of the object to delete from the database.
     */
    private void handleDeletedDocuments(Integration integration, String objectKey) throws GendoxException {
        String fileName = objectKey.substring(objectKey.lastIndexOf('/') + 1);
        Project project = projectService.getProjectById(integration.getProjectId());
        DocumentInstance documentInstance = documentService.getDocumentByFileName(project.getId(), project.getOrganizationId(), fileName);
        List<DocumentInstanceSection> documentInstanceSections = documentSectionService.getSectionsByDocument(documentInstance.getId());
        documentInstance.setDocumentInstanceSections(documentInstanceSections);
        documentService.deleteDocument(documentInstance, project.getId());
    }

}





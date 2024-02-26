package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstance;
import dev.ctrlspace.gendox.gendoxcoreapi.model.DocumentInstanceSection;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Integration;
import com.amazonaws.services.sqs.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentContent;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentSectionService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.DocumentService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.ProjectService;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration.ResourceMultipartFile;
import dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration.SQSListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class S3BucketIntegrationUpdateService implements IntegrationUpdateService {

    Logger logger = LoggerFactory.getLogger(S3BucketIntegrationUpdateService.class);

    private SQSListener sqsListener;
    private DocumentContent documentContent;
    private DocumentService documentService;
    private ProjectService projectService;
    private DocumentSectionService documentSectionService;

    @Autowired
    public S3BucketIntegrationUpdateService(SQSListener sqsListener,
                                            DocumentContent documentContent,
                                            DocumentService documentService,
                                            ProjectService projectService,
                                            DocumentSectionService documentSectionService) {
        this.sqsListener = sqsListener;
        this.documentContent = documentContent;
        this.documentService = documentService;
        this.projectService = projectService;
        this.documentSectionService = documentSectionService;
    }


    @Override
    public List<MultipartFile> checkForUpdates(Integration integration) {


        String queueName = integration.getQueueName();

        List<MultipartFile> fileList = new ArrayList<>();
        List<Message> sqsMessages = sqsListener.receiveMessages(queueName);


        for (Message sqsMessage : sqsMessages) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode rootNode = objectMapper.readTree(sqsMessage.getBody());

                // Extracting event, the bucket name and object key from the JSON structure
                String event = rootNode.at("/Records/0/eventName").asText();
                String bucketName = rootNode.at("/Records/0/s3/bucket/name").asText();
                String objectKey = rootNode.at("/Records/0/s3/object/key").asText();

                // if event is upload new document
                if (event.equals("ObjectCreated:Put")) {
                    // Constructing the S3 URL
                    String s3Url = "s3://" + bucketName + "/" + objectKey;

                    // Read content from the S3 URL
                    String content = documentContent.readDocumentContent(s3Url);

                    // Convert content to byte array
                    byte[] contentBytes = content.getBytes();

                    // Create a MultipartFile using ByteArrayResource
                    MultipartFile multipartFile = new ResourceMultipartFile(
                            contentBytes,
                            objectKey,
                            "application/octet-stream"
                    );


                    fileList.add(multipartFile);
                }

                // if event is deleted document, will handle the deletes in the future
                if (event.equals("ObjectRemoved:Delete")) {
                    // take the file name
                    String fileName = objectKey.substring(objectKey.lastIndexOf('/') + 1);
                    // get project
                    Project project = projectService.getProjectById(integration.getProjectId());
                    DocumentInstance documentInstance = documentService.getDocumentByFileName(project.getId(), project.getOrganizationId(), fileName);
                    List<DocumentInstanceSection> documentInstanceSections = documentSectionService.getSectionsByDocument(documentInstance.getId());
                    documentInstance.setDocumentInstanceSections(documentInstanceSections);
                    documentService.deleteDocument(documentInstance, project.getId());
                }

            } catch (IOException e) {
                logger.error("An error occurred while processing SQS message: " + e.getMessage());
                throw new RuntimeException(e);
            } catch (GendoxException e) {
                logger.error("An error occurred while processing SQS message: " + e.getMessage());
                throw new RuntimeException(e);
            }

        }

        return fileList;
    }
}





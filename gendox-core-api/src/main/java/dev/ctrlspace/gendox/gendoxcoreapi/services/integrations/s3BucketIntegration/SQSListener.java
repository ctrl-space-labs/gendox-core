package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import com.amazonaws.services.sqs.AmazonSQS;
import dev.ctrlspace.gendox.gendoxcoreapi.configuration.SQSConfig;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;


@Component
public class SQSListener {

    Logger logger = LoggerFactory.getLogger(SQSListener.class);

    @Value("${cloud.aws.SQS.region}")
    private String region;

    @Value("${gendox.integrations.s3.sqs.wait-time-seconds}")
    private Integer waitTime;

    private Integer visibilityTimeout = 300;


    private AmazonSQS amazonSQS;
    private MessageRepository messageRepository;

    public SQSListener(AmazonSQS amazonSQS,
                       MessageRepository messageRepository) {
        this.amazonSQS = amazonSQS;
        this.messageRepository = messageRepository;
    }

    /**
     * Receives messages from the specified SQS queue.
     *
     * @param queueName The name of the SQS queue.
     * @return A list of messages received from the queue.
     */
    public List<Message> receiveMessages(String queueName) {
        logger.debug("Getting SQS messages from queue: {}, in regions: {} with wait time: {}", queueName, region, waitTime);

        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();

        logger.trace("Queue URL: {}", queueUrl);
        ReceiveMessageRequest receiveMessageRequest = new ReceiveMessageRequest()
                .withQueueUrl(queueUrl)
                .withVisibilityTimeout(visibilityTimeout)
                .withWaitTimeSeconds(waitTime);
        // Receive messages from the queue
        List<Message> messages = amazonSQS.receiveMessage(receiveMessageRequest).getMessages();

        logger.debug("Received {} messages from the queue", messages.size());
        return messages;
    }

    /**
     * Deletes a message from the specified SQS queue.
     *
     * @param message   The message to delete.
     * @param queueName The name of the SQS queue.
     */
    public void deleteMessage(Message message, String queueName) {
        logger.debug("Deleting message {} from queue: {}", message.getMessageId(), queueName);
        // Get the URL of the queue
        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();
        // Delete the message from the queue using its receipt handle
        amazonSQS.deleteMessage(queueUrl, message.getReceiptHandle());
        logger.debug("Deleted message {} from queue: {}", message.getMessageId(), queueName);
    }


}


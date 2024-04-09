package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;


@Component
public class SQSService {

    Logger logger = LoggerFactory.getLogger(SQSService.class);

    @Value("${gendox.integrations.s3.sqs.visibility-timeout-seconds}")
    private Integer visibilityTimeout;

    private AmazonSQS amazonSQS;

    @Autowired
    public SQSService(AmazonSQS amazonSQS) {
        this.amazonSQS = amazonSQS;
    }

    /**
     * Receives messages from the specified SQS queue.
     *
     * @param queueName The name of the SQS queue.
     * @return A list of messages received from the queue.
     */
    public List<Message> receiveMessages(String queueName) {
        logger.debug("Getting SQS messages from queue: {} ", queueName);

        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();

        logger.trace("Queue URL: {}", queueUrl);
        ReceiveMessageRequest receiveMessageRequest = new ReceiveMessageRequest()
                .withQueueUrl(queueUrl)
                .withVisibilityTimeout(visibilityTimeout);

        // Receive messages from the queue
        List<Message> messages = new ArrayList<>();
        int maxMessages = 100;

        while (messages.size() < maxMessages) {
            List<Message> receivedMessages = amazonSQS.receiveMessage(receiveMessageRequest).getMessages();

            if (receivedMessages.isEmpty()){
                break;
            }
            logger.debug("Received message from the queue {}", receivedMessages);
            messages.addAll(receivedMessages);
        }

        logger.debug("Received total {} messages from the queue", messages.size());
        return messages;
    }

    /**
     * Deletes a message from the specified SQS queue.
     *
     * @param message   The message to delete.
     * @param queueName The name of the SQS queue.
     */
    public void deleteMessage(Message message, String queueName) {
        // Get the URL of the queue
        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();
        // Delete the message from the queue using its receipt handle
        amazonSQS.deleteMessage(queueUrl, message.getReceiptHandle());
        logger.debug("Deleted message {} from queue: {}", message.getMessageId(), queueName);
    }


}


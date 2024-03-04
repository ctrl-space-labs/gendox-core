package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;


@Component
public class SQSListener {

    @Value("${gendox.integrations.s3.sqs.wait-time-seconds}")
    private Integer waitTime;

    @Autowired
    private AmazonSQS amazonSQS;
    @Autowired
    private MessageRepository messageRepository;

    /**
     * Receives messages from the specified SQS queue.
     *
     * @param queueName The name of the SQS queue.
     * @return A list of messages received from the queue.
     */
    public List<Message> receiveMessages(String queueName) {
        // Get the URL of the queue
        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();
        // Create a request to receive messages with a wait time of 20 seconds
        ReceiveMessageRequest receiveMessageRequest = new ReceiveMessageRequest()
                .withQueueUrl(queueUrl)
                .withWaitTimeSeconds(waitTime);
        // Receive messages from the queue
        List<Message> messages = amazonSQS.receiveMessage(receiveMessageRequest).getMessages();

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
    }


}


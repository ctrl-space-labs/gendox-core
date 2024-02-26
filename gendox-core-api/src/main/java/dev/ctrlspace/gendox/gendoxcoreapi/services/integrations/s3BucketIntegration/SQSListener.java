package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.model.Message;
import com.amazonaws.services.sqs.model.ReceiveMessageRequest;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;


@Component
public class SQSListener {

    @Autowired
    private AmazonSQS amazonSQS;
    @Autowired
    private MessageRepository messageRepository;



    public List<Message> receiveMessages(String queueName) {
        String queueUrl = amazonSQS.getQueueUrl(queueName).getQueueUrl();
        ReceiveMessageRequest receiveMessageRequest = new ReceiveMessageRequest()
                .withQueueUrl(queueUrl)
                .withWaitTimeSeconds(20);

        List<Message> messages = amazonSQS.receiveMessage(receiveMessageRequest).getMessages();

        for (Message message: messages) {
            // Delete the message from the queue
            amazonSQS.deleteMessage(queueUrl, message.getReceiptHandle());
        }

        return messages;
    }
}


package dev.ctrlspace.gendox.gendoxcoreapi.services.integrations.s3BucketIntegration;

import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClientBuilder;

public class SQSClientFactory {

    public static AmazonSQS createSQSClient(String region) {
        return AmazonSQSClientBuilder.standard()
                .withRegion(region)
                .build();
    }
}

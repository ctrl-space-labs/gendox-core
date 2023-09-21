package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.ResourceLoader;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
//import path.to.SimpleStorageResourceLoader;





@Configuration
public class AWSConfig {

    @Value("${cloud.aws.accessKeyId}")
    private String accessKey;

    @Value("${cloud.aws.secretKey}")
    private String secretKey;

    @Value("${cloud.aws.region}")
    private String region;

    @Bean
    public AmazonS3 amazonS3() {
        return AmazonS3ClientBuilder.standard()
                .withCredentials(new AWSStaticCredentialsProvider(new BasicAWSCredentials(accessKey, secretKey)))
                .withRegion(region)
                .build();
    }

//    @Bean
//    public ResourceLoader resourceLoader(AmazonS3 amazonS3) {
//        return new DefaultResourceLoader(new SimpleStorageResourceLoader(amazonS3));
//    }
}


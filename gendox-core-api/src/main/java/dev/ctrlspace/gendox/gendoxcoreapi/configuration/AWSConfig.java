package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import io.awspring.cloud.core.io.s3.SimpleStorageProtocolResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;






@Configuration
public class AWSConfig {

    @Value("${cloud.aws.region}")
    private String region;

    @Bean
    public AmazonS3 amazonS3(DefaultResourceLoader resourceLoader) {
        AmazonS3 amazonS3 = AmazonS3ClientBuilder
                .standard()
                .withRegion(region)
                .build();
        SimpleStorageProtocolResolver simpleStorageProtocolResolver = new SimpleStorageProtocolResolver(amazonS3);
        // As we are calling it by hand, we must initialize it properly.
        simpleStorageProtocolResolver.afterPropertiesSet();
        resourceLoader.addProtocolResolver(simpleStorageProtocolResolver);
        return amazonS3;
    }

}


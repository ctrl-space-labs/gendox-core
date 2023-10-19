package dev.ctrlspace.gendox.etljobs.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.DocumentDTO;
import org.springframework.batch.item.data.RepositoryItemReader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringBatchConfiguration {




    @Bean
    public RepositoryItemReader<DocumentDTO> repositoryItemReader() {

        return null;
    }



}

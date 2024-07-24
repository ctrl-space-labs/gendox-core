package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.provenai.iscc.IsccCodeGeneratorApi;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ISCCConfig {

    @Value("${iscc.apis.code-generation}")
    private String isccCodeGenerationApiUrl;

    @Bean
    public IsccCodeGeneratorApi isccCodeGeneratorApi() {
        return new IsccCodeGeneratorApi( isccCodeGenerationApiUrl);
    }

    @Bean
    public IsccCodeService isccCodeService(IsccCodeGeneratorApi isccCodeGeneratorApi) {
        return new IsccCodeService(isccCodeGeneratorApi);
    }

}
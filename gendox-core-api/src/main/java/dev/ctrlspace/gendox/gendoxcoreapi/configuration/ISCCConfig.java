package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.provenai.iscc.IsccCodeGeneratorApi;
import dev.ctrlspace.provenai.iscc.IsccCodeService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ISCCConfig {

    @Bean
    public IsccCodeService isccCodeService(IsccCodeGeneratorApi isccCodeGeneratorApi) {
        return new IsccCodeService(isccCodeGeneratorApi);
    }

    @Bean
    public IsccCodeGeneratorApi isccCodeGeneratorApi() {
        return new IsccCodeGeneratorApi();
    }

}
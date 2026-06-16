package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.knuddels.jtokkit.Encodings;
import com.knuddels.jtokkit.api.Encoding;
import com.knuddels.jtokkit.api.EncodingRegistry;
import com.knuddels.jtokkit.api.ModelType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TokenizerConfig {

    @Bean
    public EncodingRegistry encodingRegistry() {
        return Encodings.newDefaultEncodingRegistry();
    }

    @Bean
    public Encoding gpt4oEncoding(EncodingRegistry encodingRegistry) {
        return encodingRegistry.getEncodingForModel(ModelType.GPT_4O);
    }


}

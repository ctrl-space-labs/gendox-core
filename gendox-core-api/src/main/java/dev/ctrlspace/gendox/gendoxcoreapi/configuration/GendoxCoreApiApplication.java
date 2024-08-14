package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import dev.ctrlspace.gendox.authentication.GendoxAuthenticationToken;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.AiModelMessage;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeService;
import dev.ctrlspace.gendox.spring.batch.jobs.SpringBatchConfiguration;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.UserController;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.observations.LoggingObservationHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.slf4j.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.util.StringJoiner;

@SpringBootApplication
@ComponentScan(basePackageClasses = {
        UserController.class,
        GendoxCoreApiApplication.class,
        UserProfileConverter.class,
        JWTUtils.class,
        GendoxException.class,
        UserService.class,
        UserRepository.class,
        AiModelApiAdapterService.class,
        Listener.class,
        SpringBatchConfiguration.class,
        LoggingObservationHandler.class,
        SpringBatchConfiguration.class,
        GendoxAuthenticationToken.class,
        UniqueIdentifierCodeService.class
        })
@EnableCaching
@EnableJpaRepositories(basePackageClasses = {UserRepository.class})
@EntityScan(basePackageClasses = {
        User.class,
        AiModelMessage.class
})
public class GendoxCoreApiApplication {
    Logger logger = org.slf4j.LoggerFactory.getLogger(getClass());

    public static void main(String[] args) {
        SpringApplication.run(GendoxCoreApiApplication.class, args);
    }

    @Bean("gendoxKeyGenerator")
    public KeyGenerator keyGenerator() {
        return (target, method, params) -> {
            StringJoiner joiner = new StringJoiner(":");
            joiner.add(target.getClass().getSimpleName());
            joiner.add(method.getName());
            for (Object param : params) {
                joiner.add(param.toString());
            }
            return joiner.toString();
        };
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();

        // Register the JavaTimeModule
        objectMapper.registerModule(new JavaTimeModule());

        objectMapper.addMixIn(Object.class, IgnoreHibernatePropertiesInJackson.class);

        // Disable unwanted serialization features
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

        return objectMapper;
    }

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private abstract class IgnoreHibernatePropertiesInJackson{ }

}

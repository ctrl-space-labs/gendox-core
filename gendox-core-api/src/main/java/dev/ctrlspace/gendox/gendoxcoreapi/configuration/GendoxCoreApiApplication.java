package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.authentication.GendoxJwtAuthenticationConverter;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeResponse;
import dev.ctrlspace.gendox.provenAi.utils.UniqueIdentifierCodeService;
import dev.ctrlspace.gendox.spring.batch.jobs.SpringBatchConfiguration;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelService;
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
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
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
        AiModelService.class,
        Listener.class,
        SpringBatchConfiguration.class,
        LoggingObservationHandler.class,
        SpringBatchConfiguration.class,
        GendoxJwtAuthenticationConverter.class,
        UniqueIdentifierCodeService.class
        })
@EnableCaching
@EnableJpaRepositories(basePackageClasses = {UserRepository.class})
@EntityScan(basePackageClasses = {User.class})
public class GendoxCoreApiApplication {
    Logger logger = org.slf4j.LoggerFactory.getLogger(getClass());

    public static void main(String[] args) {
        SpringApplication.run(GendoxCoreApiApplication.class, args);
    }


    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager();
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

}

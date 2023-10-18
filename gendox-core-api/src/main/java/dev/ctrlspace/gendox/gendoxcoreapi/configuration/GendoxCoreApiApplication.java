package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.AiModelService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.openai.aiengine.aiengine.OpenAiClient;
import dev.ctrlspace.gendox.gendoxcoreapi.controller.UserController;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.UserProfileConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.Listener;
import dev.ctrlspace.gendox.gendoxcoreapi.discord.commands.AskGendox;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.User;
import dev.ctrlspace.gendox.gendoxcoreapi.observations.LoggingObservationHandler;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.UserRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.UserService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.JWTUtils;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
//import org.springframework.web.client.RestClient;
//import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

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
        AskGendox.class,
        LoggingObservationHandler.class
        })
@EnableJpaRepositories(basePackageClasses = {UserRepository.class})
@EntityScan(basePackageClasses = {User.class})
public class GendoxCoreApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(GendoxCoreApiApplication.class, args);
    }


    @Bean
    public OpenAiClient openAiService() {
//return null;

        RestClient restClient = RestClient.create("https://api.openai.com/v1");
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient)).build();
        return httpServiceProxyFactory.createClient(OpenAiClient.class);
    }

}

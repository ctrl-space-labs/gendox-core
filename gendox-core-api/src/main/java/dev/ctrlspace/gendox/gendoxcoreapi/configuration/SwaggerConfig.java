package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import java.net.URI;

import static org.springframework.web.servlet.function.RequestPredicates.GET;
import static org.springframework.web.servlet.function.RouterFunctions.route;

// ...

//@Configuration
public class SwaggerConfig {

    @Bean
    public RouterFunction<ServerResponse> routerFunction() {
        return route(GET("/swagger-ui/index.html"), req ->
                ServerResponse.temporaryRedirect(URI.create("/swagger-ui/index.html")).build());
    }

    @Bean
    public RouterFunction<ServerResponse> routerFunction0() {
        return route(GET("/swagger-ui/index.html"), req ->
                ServerResponse.temporaryRedirect(URI.create("/swagger-ui/index.html")).build());
    }
    @Bean
    public RouterFunction<ServerResponse> routerFunction1() {
        return route(GET("/swagger-ui/**"), req ->
                ServerResponse.temporaryRedirect(URI.create("/swagger-ui/index.html")).build());
    }

    @Bean
    public RouterFunction<ServerResponse> routerFunction2() {
        return route(GET("/v3/api-docs/**"), req ->
                ServerResponse.temporaryRedirect(URI.create("/v3/api-docs/default-group")).build());
    }

    @Bean
    public RouterFunction<ServerResponse> routerFunction3() {
        return route(GET("/v3/api-docs/default-group"), req ->
                ServerResponse.ok()
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .body("{ \"openapi\": \"3.0.3\", \"info\": { \"title\": \"API Documentation\", \"version\": \"1.0\" }, \"paths\": {} }"));
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import com.nimbusds.jose.JOSEException;
import dev.ctrlspace.gendox.authentication.JwtUserProfileConversionFilter;
import dev.ctrlspace.gendox.authentication.JwtUserRegistrationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfiguration {

    @Value("${rsa.private-key}")
    private String privateKeyPath;

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    @Qualifier("delegatedAuthenticationEntryPoint")
    private AuthenticationEntryPoint authEntryPoint;


    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
//        configuration.setAllowCredentials(true);
//        configuration.addAllowedOrigin("http://localhost:3000"); // Allow the React app origin
//        configuration.addAllowedOrigin("http://localhost:3001"); // Allow the React app origin
        configuration.addAllowedOrigin("*"); // Allow the React app origin
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           JwtDecoder jwtDecoder,
                                           JwtUserRegistrationFilter jwtUserRegistrationFilter,
                                           JwtUserProfileConversionFilter jwtUserProfileConversionFilter,
                                           CorsConfigurationSource corsConfigurationSource) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests((authz) ->
                        authz
                                .requestMatchers("/invitations/acceptance").permitAll()
                                .requestMatchers("/actuator/health").permitAll()
                                .requestMatchers("/auth/signup").permitAll()
                                .requestMatchers("/users/login").permitAll()
                                .requestMatchers("/messages/semantic-completion").permitAll() // Allow requests when the Project Agent is Public
                                .requestMatchers("/organizations/*/projects").permitAll()
                                .requestMatchers("/threads/*/messages").permitAll()
                                .requestMatchers("/threads").permitAll()
                                .requestMatchers("/api-documentation",
                                        "/swagger-ui.html",
                                        "/swagger-ui/**",
                                        "/v3/api-docs",
                                        "/v3/api-docs/**",
                                        "/swagger-resources",
                                        "/swagger-resources/**",
                                        "/webjars/**").permitAll()
                                .anyRequest().authenticated()
                )
                .exceptionHandling(httpExConfigurer -> httpExConfigurer.authenticationEntryPoint(authEntryPoint))
//                .httpBasic(Customizer.withDefaults())
//                .authenticationProvider(daoAuthenticationProvider)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
//                .oauth2ResourceServer(oauth2 ->
//                        oauth2.jwt(jwt -> {
//                            jwt.decoder(jwtDecoder);
//                            jwt.jwtAuthenticationConverter(jwtAuthenticationConverter);
//                        }));


        http.oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> {
                    jwt.decoder(jwtDecoder);

                }))
                .addFilterAfter(jwtUserRegistrationFilter, BearerTokenAuthenticationFilter.class)
                .addFilterAfter(jwtUserProfileConversionFilter, JwtUserRegistrationFilter.class);

        return http.build();
    }

//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return NoOpPasswordEncoder.getInstance();
//    }
//
//    @Bean
//    public AuthenticationProvider daoAuthenticationProvider(PasswordEncoder passwordEncoder, UserService userDetailsService) {
//        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
//        provider.setPasswordEncoder(passwordEncoder);
//        provider.setUserDetailsService(userDetailsService);
//        return provider;
//    }
//
//    @Bean
//    public JwtAuthenticationConverter jwtAuthenticationConverter() {
//        // Customize the converter here
//        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
//        jwtGrantedAuthoritiesConverter.setAuthorityPrefix(""); // removes the default SCOPE_ prefix
//
//        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
//        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
//
//        return jwtAuthenticationConverter;
//
//    }
//
//    @Bean
//    public JWK gendoxJwk() throws IOException, JOSEException, NoSuchAlgorithmException, ParseException, InvalidKeySpecException {
//        Resource resource = resourceLoader.getResource(privateKeyPath);
//        String privateKey = null;
//        try (InputStream inputStream = resource.getInputStream();
//             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
//            privateKey = reader.lines()
//                    .collect(Collectors.joining(System.lineSeparator()));
//        }
//
//        JWK jwk = JWK.parseFromPEMEncodedObjects(privateKey);
//
//        // Convert the public key string to an RSAPublicKey object
//        return jwk;
//    }
//
//    @Bean
//    public RSAKey gendoxRsaKey(JWK gendoxJwk) {
//        return gendoxJwk.toRSAKey();
//    }
//
//    @Bean
//    public JWKSource<SecurityContext> gendoxJwkSource(RSAKey gendoxRsaKey) {
//        return (jwkSelector, securityContext) -> jwkSelector.select(new JWKSet(gendoxRsaKey));
//    }
//
//
//    @Bean
//    public JwtDecoder gendoxJwtDecoder(@Qualifier("gendoxRsaKey") RSAKey rsaKey) throws JOSEException {
//        return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey()).build();
//    }

    @Bean
    public JwtDecoder jwtDecoder() throws JOSEException {
        return NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
    }

//    @Bean
//    public JwtEncoder gendoxJwtEncoder(JWKSource<SecurityContext> jwkSource) throws JOSEException {
//        return new NimbusJwtEncoder(jwkSource);
//    }


}

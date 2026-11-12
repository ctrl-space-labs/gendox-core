package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;
import io.micrometer.core.instrument.config.MeterFilter;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.aop.ObservedAspect;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.observation.ClientRequestObservationContext;
import org.springframework.http.client.observation.ClientRequestObservationConvention;
import org.springframework.http.client.observation.DefaultClientRequestObservationConvention;
import org.springframework.http.server.observation.DefaultServerRequestObservationConvention;
import org.springframework.http.server.observation.ServerRequestObservationContext;
import org.springframework.http.server.observation.ServerRequestObservationConvention;

@Configuration(proxyBeanMethods = false)
public class ObservabilityConfiguration {

    @Bean
    public ObservedAspect observedAspect(ObservationRegistry observationRegistry) {
        return new ObservedAspect(observationRegistry);
    }

    @Bean
    public ClientRequestObservationConvention clientRequestObservationConvention() {
        return new DefaultClientRequestObservationConvention() {
            @Override
            protected KeyValue uri(ClientRequestObservationContext context) {
                String template = context.getUriTemplate();
                if (template == null) {
                    return KeyValue.of("uri", "none");
                }
                String path = template.split("[?#]", 2)[0];
                // Only explicit templates are safe dimensions; direct URLs can embed document IDs.
                return path.contains("{") ? KeyValue.of("uri", path.replaceFirst("^https?://[^/]+", ""))
                        : KeyValue.of("uri", "none");
            }

            @Override
            public KeyValues getHighCardinalityKeyValues(ClientRequestObservationContext context) {
                // Full URLs can contain credentials, query text or document identifiers.
                return KeyValues.empty();
            }
        };
    }

    @Bean
    public ServerRequestObservationConvention serverRequestObservationConvention() {
        return new DefaultServerRequestObservationConvention() {
            @Override
            public KeyValues getHighCardinalityKeyValues(ServerRequestObservationContext context) {
                return KeyValues.empty();
            }
        };
    }

    @Bean
    public MeterFilter serverUriCardinalityLimit() {
        return MeterFilter.maximumAllowableTags("http.server.requests", "uri", 100, MeterFilter.deny());
    }

    @Bean
    public MeterFilter clientUriCardinalityLimit() {
        return MeterFilter.maximumAllowableTags("http.client.requests", "uri", 100, MeterFilter.deny());
    }

    @Bean
    public MeterFilter clientHostCardinalityLimit() {
        return MeterFilter.maximumAllowableTags("http.client.requests", "client.name", 100, MeterFilter.deny());
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import io.micrometer.common.KeyValue;
import io.micrometer.common.KeyValues;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.support.ContextPropagatingTaskDecorator;
import org.springframework.http.client.observation.ClientRequestObservationContext;
import org.springframework.http.client.observation.ClientRequestObservationConvention;
import org.springframework.http.client.observation.DefaultClientRequestObservationConvention;
import org.springframework.http.server.observation.DefaultServerRequestObservationConvention;
import org.springframework.http.server.observation.ServerRequestObservationContext;
import org.springframework.http.server.observation.ServerRequestObservationConvention;

@Configuration(proxyBeanMethods = false)
public class ObservabilityConfiguration {

    @Bean
    public ContextPropagatingTaskDecorator taskDecorator() {
        return new ContextPropagatingTaskDecorator();
    }

    @Bean
    public ClientRequestObservationConvention clientRequestObservationConvention() {
        return new DefaultClientRequestObservationConvention() {
            @Override
            protected KeyValue uri(ClientRequestObservationContext context) {
                // Client URLs may contain credentials or document IDs, including in URI templates.
                return KeyValue.of("uri", "none");
            }

            @Override
            public KeyValues getHighCardinalityKeyValues(ClientRequestObservationContext context) {
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
}

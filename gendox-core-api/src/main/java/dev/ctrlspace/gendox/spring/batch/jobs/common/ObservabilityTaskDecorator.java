package dev.ctrlspace.gendox.spring.batch.jobs.common;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.slf4j.MDC;
import org.springframework.core.task.TaskDecorator;

import java.util.Map;

public class ObservabilityTaskDecorator implements TaskDecorator {

    private final ObservationRegistry observationRegistry;

    public ObservabilityTaskDecorator(ObservationRegistry observationRegistry) {
        this.observationRegistry = observationRegistry;
    }

    @Override
    public Runnable decorate(Runnable runnable) {
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        Observation parentObservation = observationRegistry.getCurrentObservation();

        return () -> {
            Observation observation = null;
            try (Observation.Scope scope = parentObservation != null ? parentObservation.openScope() : null) {
                if (contextMap != null) {
                    MDC.setContextMap(contextMap);
                }

                // Start a new observation (span) for the thread execution
                observation = Observation.start("-spring-batch-thread-execution-span", observationRegistry)
                        .parentObservation(parentObservation);

                // Run the task within the observation scope
                observation.scoped(runnable);
            } finally {
                MDC.clear();

                // Ensure the observation is stopped even if an exception occurs
                if (observation != null) {
                    observation.stop();
                }
            }
        };
    }
}

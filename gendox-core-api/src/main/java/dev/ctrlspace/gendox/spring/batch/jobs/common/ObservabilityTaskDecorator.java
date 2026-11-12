package dev.ctrlspace.gendox.spring.batch.jobs.common;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationRegistry;
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
        Observation parent = observationRegistry.getCurrentObservation();
        return () -> {
            Map<String, String> previous = MDC.getCopyOfContextMap();
            try (Observation.Scope scope = parent != null ? parent.openScope() : null) {
                restoreMdc(contextMap);
                // Set the parent before starting, and record failures before stopping the observation.
                Observation.createNotStarted("gendox.async.task", observationRegistry)
                        .parentObservation(parent)
                        .observe(runnable);
            } finally {
                // Executors may reuse a thread, or execute inline: restore its caller's context.
                restoreMdc(previous);
            }
        };
    }

    private static void restoreMdc(Map<String, String> context) {
        if (context == null) {
            MDC.clear();
        } else {
            MDC.setContextMap(context);
        }
    }
}

package dev.ctrlspace.gendox.spring.batch.jobs.common;

import io.micrometer.observation.Observation;
import io.micrometer.observation.ObservationHandler;
import io.micrometer.observation.ObservationRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class ObservabilityTaskDecoratorTest {
    @AfterEach void cleanMdc() { MDC.clear(); }

    @Test
    void propagatesParentRecordsFailureAndRestoresWorkerContext() {
        ObservationRegistry registry = ObservationRegistry.create();
        List<Observation.Context> stopped = new ArrayList<>();
        registry.observationConfig().observationHandler(new ObservationHandler<Observation.Context>() {
            public boolean supportsContext(Observation.Context context) { return true; }
            public void onStop(Observation.Context context) { stopped.add(context); }
        });
        Observation parent = Observation.start("parent", registry);
        RuntimeException failure = new IllegalStateException("task failure");
        Runnable decorated;
        MDC.put("request", "parent-context");
        try (Observation.Scope ignored = parent.openScope()) {
            decorated = new ObservabilityTaskDecorator(registry).decorate(() -> {
                assertThat(registry.getCurrentObservation().getContext().getParentObservation()).isSameAs(parent);
                assertThat(MDC.get("request")).isEqualTo("parent-context");
                throw failure;
            });
        }
        MDC.put("request", "worker-context");
        assertThatThrownBy(decorated::run).isSameAs(failure);
        assertThat(MDC.get("request")).isEqualTo("worker-context");
        assertThat(registry.getCurrentObservation()).isNull();
        assertThat(stopped).hasSize(1);
        assertThat(stopped.getFirst().getError()).isSameAs(failure);
        parent.stop();
    }

    @Test
    void inlineExecutionKeepsTheCallingObservationAndMdc() {
        ObservationRegistry registry = ObservationRegistry.create();
        registry.observationConfig().observationHandler(new ObservationHandler<Observation.Context>() {
            public boolean supportsContext(Observation.Context context) { return true; }
        });
        Observation parent = Observation.start("parent", registry);
        MDC.put("request", "caller");
        try (Observation.Scope ignored = parent.openScope()) {
            new ObservabilityTaskDecorator(registry).decorate(() -> MDC.put("request", "changed")).run();
            assertThat(registry.getCurrentObservation()).isSameAs(parent);
            assertThat(MDC.get("request")).isEqualTo("caller");
        } finally {
            parent.stop();
        }
    }
}

package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.observation.Observation;
import io.micrometer.tracing.Tracer;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.sdk.trace.SpanProcessor;
import io.opentelemetry.sdk.logs.export.LogRecordExporter;
import io.opentelemetry.sdk.metrics.export.MetricExporter;
import org.junit.jupiter.api.Test;
import org.springframework.core.task.TaskDecorator;
import java.util.concurrent.Executors;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.micrometer.observation.autoconfigure.ObservationAutoConfiguration;
import org.springframework.boot.micrometer.tracing.autoconfigure.MicrometerTracingAutoConfiguration;
import org.springframework.boot.micrometer.tracing.autoconfigure.NoopTracerAutoConfiguration;
import org.springframework.boot.micrometer.tracing.opentelemetry.autoconfigure.OpenTelemetryTracingAutoConfiguration;
import org.springframework.boot.micrometer.tracing.opentelemetry.autoconfigure.otlp.OtlpTracingAutoConfiguration;
import org.springframework.boot.opentelemetry.autoconfigure.OpenTelemetrySdkAutoConfiguration;
import org.springframework.boot.opentelemetry.autoconfigure.logging.OpenTelemetryLoggingAutoConfiguration;
import org.springframework.boot.opentelemetry.autoconfigure.logging.otlp.OtlpLoggingAutoConfiguration;

import static org.assertj.core.api.Assertions.assertThat;

class ObservabilityDefaultsTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(ObservabilityConfiguration.class)
            .withConfiguration(AutoConfigurations.of(ObservationAutoConfiguration.class,
                    MicrometerTracingAutoConfiguration.class, NoopTracerAutoConfiguration.class,
                    OpenTelemetrySdkAutoConfiguration.class, OpenTelemetryTracingAutoConfiguration.class,
                    OtlpTracingAutoConfiguration.class, OpenTelemetryLoggingAutoConfiguration.class,
                    OtlpLoggingAutoConfiguration.class));

    @Test
    void applicationDefaultsHaveALocalTracerAndNoExporters() {
        assertLocalOnly(runner);
    }

    @Test
    void structuredLoggingProfileAlsoLeavesAllExportersOff() {
        assertLocalOnly(runner.withPropertyValues("spring.profiles.active=observability"));
    }

    @Test
    void springDecoratorPropagatesTheParentWithoutCreatingAnExtraTaskSpan() {
        runner.withPropertyValues("management.opentelemetry.enabled=true").run(context -> {
            ObservationRegistry registry = context.getBean(ObservationRegistry.class);
            Tracer tracer = context.getBean(Tracer.class);
            Observation parent = Observation.start("parent", registry);
            try (var executor = Executors.newSingleThreadExecutor()) {
                Runnable task;
                try (Observation.Scope ignored = parent.openScope()) {
                    String traceId = tracer.currentSpan().context().traceId();
                    task = context.getBean(TaskDecorator.class).decorate(() -> {
                        assertThat(registry.getCurrentObservation()).isSameAs(parent);
                        assertThat(tracer.currentSpan().context().traceId()).isEqualTo(traceId);
                    });
                }
                executor.submit(task).get();
                assertThat(executor.submit(registry::getCurrentObservation).get()).isNull();
                assertThat(executor.submit(tracer::currentSpan).get()).isNull();
            } finally {
                parent.stop();
            }
        });
    }

    private void assertLocalOnly(ApplicationContextRunner contextRunner) {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed().hasSingleBean(ObservationRegistry.class).hasSingleBean(Tracer.class);
            assertThat(context.getBeansOfType(SpanProcessor.class)).isEmpty();
            assertThat(context.getBeansOfType(SpanExporter.class)).isEmpty();
            assertThat(context.getBeansOfType(LogRecordExporter.class)).isEmpty();
            assertThat(context.getBeansOfType(MetricExporter.class)).isEmpty();
            assertThat(context.getEnvironment().getProperty("management.opentelemetry.enabled")).isEqualTo("false");
            assertThat(context.getEnvironment().getProperty("management.opentelemetry.map-environment-variables")).isEqualTo("false");

        });
    }
}

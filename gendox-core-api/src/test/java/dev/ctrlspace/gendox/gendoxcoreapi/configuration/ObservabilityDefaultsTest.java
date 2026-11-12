package dev.ctrlspace.gendox.gendoxcoreapi.configuration;

import io.micrometer.observation.ObservationRegistry;
import io.micrometer.tracing.Tracer;
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.TraceFlags;
import io.opentelemetry.api.trace.TraceState;
import io.opentelemetry.context.Context;
import io.opentelemetry.sdk.trace.export.SpanExporter;
import io.opentelemetry.sdk.logs.export.LogRecordExporter;
import io.opentelemetry.sdk.metrics.export.MetricExporter;
import org.junit.jupiter.api.Test;
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

    private void assertLocalOnly(ApplicationContextRunner contextRunner) {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed().hasSingleBean(ObservationRegistry.class).hasSingleBean(Tracer.class);
            assertThat(context.getBean(Tracer.class).getClass().getSimpleName()).isEqualTo("OtelTracer");
            assertThat(context.getBeansOfType(SpanExporter.class)).isEmpty();
            assertThat(context.getBeansOfType(LogRecordExporter.class)).isEmpty();
            assertThat(context.getBeansOfType(MetricExporter.class)).isEmpty();
            assertThat(context.getEnvironment().getProperty("management.tracing.sampling.probability")).isEqualTo("0.0");
            assertThat(context.getEnvironment().getProperty("management.opentelemetry.map-environment-variables")).isEqualTo("false");
            Span remoteParent = Span.wrap(SpanContext.createFromRemoteParent(
                    "0123456789abcdef0123456789abcdef", "0123456789abcdef", TraceFlags.getSampled(), TraceState.getDefault()));
            Span local = context.getBean(OpenTelemetry.class).getTracer("defaults-test").spanBuilder("request")
                    .setParent(Context.root().with(remoteParent)).startSpan();
            try {
                assertThat(local.isRecording()).isFalse();
            } finally {
                local.end();
            }
        });
    }
}

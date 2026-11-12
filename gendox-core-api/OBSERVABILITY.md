# Backend observability

The backend uses Spring Boot 4.1's Micrometer/OpenTelemetry integration. Grafana
infrastructure is a separate deployment; none is configured or contacted here.

## Default behavior

- Trace export is off (`GENDOX_TRACING_EXPORT_ENABLED=false`). No OTLP trace
  exporter is created, and no collector URL is configured.
- Sampling is zero (`GENDOX_TRACING_SAMPLING_PROBABILITY=0.0`). The default
  `trace-id-ratio` sampler also ignores an external caller's sampled-parent flag.
- OTLP log and metric exports are explicitly off. OpenTelemetry environment-variable
  mapping is off, so inherited `OTEL_*` settings cannot silently turn them on.
- Metrics remain in memory and available for authenticated Prometheus scraping.
  HTTP health/liveness/readiness are public and omit component details. All other
  actuator paths require the `GENDOX_SUPER_ADMIN` global role; organization API
  keys and ordinary users cannot scrape them. Only health and Prometheus are exposed.
- Local logs retain trace/span correlation. Observation logs never serialize method
  arguments. HTTP telemetry omits full URLs, queries and literal client paths.
  Explicit URI templates are allowed; client hosts and server/client URI labels are
  each capped at 100 distinct values per process.
- Boot retains an idle batch processor even without an exporter. Its queue is bounded
  at 512 spans, with 128 per batch. Zero default sampling avoids recording spans.
  This change has functional and e2e verification, not a production load benchmark.

HTTP request/client metrics, JVM/pool metrics, scheduled tasks, existing `@Observed`
service operations and Spring Batch observations are available. Async work restores
its parent's observation/MDC, records failures and restores the worker context on exit.
Spring HTTP clients use Boot's builders. Third-party SDK transports and individual SQL
statements are not automatically instrumented; assess these separately if needed.

## Optional structured console logs

Append `observability` to the active profiles, after the deployment profile:

```text
SPRING_PROFILES_ACTIVE=prod,observability
GENDOX_ENVIRONMENT=production
```

This formats console logs as Logstash JSON with service/environment and MDC correlation
fields, and sets application logging to INFO. It does not enable export, create a
file sink or change the existing deployment's log driver. Existing application messages
still require normal operational access controls and retention policies.

## Later collector rollout

Deploy Grafana Alloy or an OpenTelemetry Collector beside the workload, collect console
logs into Loki, scrape Prometheus metrics into a metrics backend, and receive OTLP traces
for Tempo. Grafana queries those backends. On Hetzner the agent can run beside the
containers; on ECS use a reviewed sidecar/log-router or existing log-driver integration.
Collector configuration, service credentials, network rules and retention are outside
this change. Plan dedicated collector authentication before scheduling metric scraping.

After a collector is ready, trace export requires an explicit deployment change:

```text
GENDOX_TRACING_EXPORT_ENABLED=true
GENDOX_TRACING_SAMPLING_PROBABILITY=0.1
MANAGEMENT_OPENTELEMETRY_TRACING_EXPORT_OTLP_ENDPOINT=https://collector.example.invalid/v1/traces
```

The URL above is a documentation placeholder. Keep authentication headers in deployment
secrets. If upstream sampling must be respected, explicitly select
`GENDOX_TRACING_SAMPLER=parent-based-trace-id-ratio` after reviewing trust boundaries.
Trace exports use a one-second connection timeout and two-second call timeout. Log and
metric OTLP exports stay off; use console collection and Prometheus scraping instead.
Disable tracing export and reset sampling to zero to return to the local-only state.

## Official documentation

- [Spring Boot tracing and supported HTTP builders](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [Spring Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Spring Boot structured logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Spring Boot application properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

See the upgrade plan in `.ai/spring-boot-4-upgrade-2026-11-12.md` for migration and
validation details, including the coordinated Spring Batch database rollout.

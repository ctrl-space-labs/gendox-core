# Backend observability

Spring Boot supplies metrics, tracing integration and logging. This backend does not
configure or contact Grafana infrastructure.

## Local defaults

- Actuator/Micrometer collect HTTP, JVM, pool, scheduled-task and Batch metrics.
  Prometheus can scrape them. URI metric labels use Boot's default limit of 100.
- OpenTelemetry is disabled with `management.opentelemetry.enabled=false`.
  There are no span processors or export workers in this state. Trace/log push
  exports and OTLP metric exports are also explicitly off. Mapping inherited
  `OTEL_*` settings is off. No collector endpoint is configured.
- Health, liveness and readiness are public and omit component details. Other
  actuator endpoints require the global `GENDOX_SUPER_ADMIN` role. Only health
  and Prometheus are exposed; ordinary users and organization API keys cannot scrape.
- Boot's `management.observations.annotations.enabled=true` handles existing
  `@Observed` timings/errors. Normal application log statements remain; the custom
  before/after logger and its logging-control metric tags have been removed.
- All existing custom executors share Spring's `ContextPropagatingTaskDecorator`.
  It restores observation/tracing context without creating an extra span per task.
- HTTP clients use Boot's builders and configured JSON converters. Two small HTTP
  conventions omit full URLs and client path labels, which can contain sensitive
  values. Server metrics retain route templates; client metrics retain method,
  destination host, status and outcome. No argument/body logging is added.

## Logs

Append `observability` to active profiles (for example `prod,observability`) to
format console logs as Boot's Logstash JSON at INFO level. This profile enables
no export. A deployment agent can collect stdout later. Trace/span correlation
is populated when tracing is enabled and a trace is active.

## Later deployment

A collector can gather console logs for Loki, scrape Prometheus metrics, and
receive traces for Tempo. Grafana queries those backends. Deploy the collector
beside Hetzner containers or as an ECS sidecar/log-router. Service authentication,
network rules and retention belong to that deployment. Third-party SDK transports
and individual SQL statements need separate instrumentation if required.

When the collector is ready, use standard Boot properties/environment variables:

```text
MANAGEMENT_OPENTELEMETRY_ENABLED=true
MANAGEMENT_TRACING_EXPORT_ENABLED=true
MANAGEMENT_OPENTELEMETRY_TRACING_EXPORT_OTLP_ENDPOINT=https://collector.example.invalid/v1/traces
```

The endpoint is a documentation placeholder. Store collector credentials in deployment
secrets. Boot's default parent-based sampler samples 10% of new traces. Keep log and
metric OTLP export off when using stdout collection and Prometheus scraping.
To disable tracing again, restore the two enable flags to false.

## References

- [Boot tracing and HTTP builders](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [Boot observability and context propagation](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Boot logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Boot defaults and properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

Validation is in `.ai/spring-boot-4-upgrade-2026-11-12.md`. No production load
benchmark or collector deployment is included.

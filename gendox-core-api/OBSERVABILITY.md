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

## Collector (optional)

`docker-compose.yml` includes an optional Grafana Alloy collector (`gendox-alloy`,
config in `gendox-compose-scripts/observability/config.alloy`). It pushes to a Loki,
Prometheus and Tempo you provide:

```text
container stdout (all containers)  -> Alloy -> Loki
gendox-core-api OTLP metrics        -> Alloy -> Prometheus (remote write)
gendox-core-api OTLP traces         -> Alloy -> Tempo
host CPU/memory/disk/network        -> Alloy -> Prometheus
```

The API pushes its metrics as OTLP instead of being scraped. `/actuator/prometheus`
stays where it is, still behind `GENDOX_SUPER_ADMIN`, and health checks are unchanged.

Everything is off by default. To turn it on, set:

```text
COMPOSE_PROFILES=observability          # starts gendox-alloy
GENDOX_OTEL_ENABLED=true                # tracing + OTLP metrics export
GENDOX_ENVIRONMENT=<name>               # `environment` label on metrics and logs
GENDOX_TRACING_SAMPLING_PROBABILITY=1.0 # optional; Boot's default is 0.1
SPRING_PROFILES_ACTIVE=...,observability
OBSERVABILITY_INGEST_URL                # base URL; Alloy appends /ingest/loki/...,
                                        # /ingest/prometheus/... and /ingest/otlp/...
OBSERVABILITY_INGEST_USERNAME / _PASSWORD   # basic auth for the ingest URL
```

Metrics are exported every 30s with seconds as the time unit, so names match the
Prometheus registry (`http_server_requests_seconds_bucket`, `jvm_memory_used_bytes`).
To turn it off, leave `GENDOX_OTEL_ENABLED` unset (the default is false).
Third-party SDK transports and individual SQL statements are not traced.

## References

- [Boot tracing and HTTP builders](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [Boot observability and context propagation](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Boot logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Boot defaults and properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

The upgrade is issue #580. No production load
benchmark or collector deployment is included.

# Spring Boot 4 upgrade and observability preparation

## Upgrade

The backend moves from Spring Boot 3.5.8 to 4.1.2, Spring Framework 7,
Spring Batch 6 and Spring AI 2.0.2, retaining Java 25.
The migration updates modular starters, Hibernate/Hypersistence, Springdoc and
ShedLock, and removes older explicit versions of dependencies managed by Boot.

Jackson 2 remains an explicit compatibility boundary for application DTOs,
MVC, outbound HTTP clients and Hibernate JSON columns. Spring AI also brings
Jackson 3. Boot's deprecated Jackson 2 module is temporary: port application
serializers and tree models before removing it or upgrading beyond its support.

Batch imports and job launching use the version 6 APIs. JDBC job metadata stays
in `gendox_jobs`; the forward migration renames the job-instance sequence.
**Deployment requires draining/stopping all Batch 5 API instances and jobs before
applying this migration and starting Batch 6.** A rolling deployment mixing these
versions is unsupported. Rollback needs an explicit database restoration or
reviewed reverse migration; reverting only the application jar is insufficient.
Existing chunk implementations remain on Batch 6's deprecated compatibility API.

## Official references reviewed

- [Boot 4.0 migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Boot 4.1 release notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes)
- [Batch 6 migration guide](https://github.com/spring-projects/spring-batch/wiki/Spring-Batch-6.0-Migration-Guide)
- [Spring AI upgrade notes](https://docs.spring.io/spring-ai/reference/upgrade-notes.html)
- [Boot tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html)
- [Boot observability](https://docs.spring.io/spring-boot/reference/actuator/observability.html)
- [Boot logging](https://docs.spring.io/spring-boot/reference/features/logging.html)
- [Boot configuration properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

## Validation

The upgrade uses its own ephemeral environment, with mock models and a freshly
built frontend. Restart the frontend container after its first build if it mounted
an empty export directory before the build replaced that directory.

- Backend unit run: 330 tests, zero assertion failures, seven errors and two skipped.
  The seven errors exactly match the pre-upgrade baseline: document test fixtures,
  document-reader mock setup and one strict Mockito stubbing error.
- API e2e: 83 passed, two failures matching the existing coverage plan.
- Smoke: all 19 passed, including browser login, documents, chat and settings.
- Full e2e: 120 passed, three pre-existing database-dependent failures, no skips
  or retries, in 44 seconds. The profile case now uses its own organization/project
  so concurrent workspace cleanup cannot redirect it into the new-agent wizard.

The existing database-dependent e2e failures are recorded in the
[v2 coverage plan](e2e-v2-coverage-2026-11-11.md); this migration does not change
those tests or mark their failures as expected successes. Paid model providers,
ProvenAI and production infrastructure are outside this validation.

## Observability

Use Boot's OpenTelemetry starter and auto-configured HTTP builders. Keep the SDK,
trace/log push export, OTLP metric export and inherited `OTEL_*` mapping disabled
until a collector is deployed. SDK-off context tests verify there are no exporters
or span processors. Prometheus/Micrometer metrics remain local and scrapeable by
an operator; health probes remain public without component details.

Boot supplies `@Observed` aspects through `management.observations.annotations.enabled`.
Spring's `ContextPropagatingTaskDecorator` replaces the custom async decorator.
The custom before/after observation logger, its logging-control metric tags, redundant
URI-limit filters, tuning aliases and `Jackson2RestTemplates` have been removed.
Boot already limits URI labels to 100. Only HTTP URL privacy conventions remain custom.
The optional `observability` profile selects Boot's JSON console logging.

Jackson 2 converter selection is still temporarily configured through Boot, which
applies it to its HTTP builders. The application no longer rewrites converter lists.
A separate Jackson 3 change will add explicit JSON API contracts, establish their
Jackson 2 baseline, migrate application types and remove the compatibility settings.

The preceding implementation was verified with 337 backend tests (the same seven
baseline errors and two skips), 19 passing smoke cases and 120 passing e2e cases
with the same three documented database-dependent failures. Simplification validation:
17 focused backend checks passed and all 19 smoke cases passed. No production load benchmark was performed.

See [`gendox-core-api/OBSERVABILITY.md`](../gendox-core-api/OBSERVABILITY.md) for
operation, coverage limits and the later Hetzner/ECS collector setup.

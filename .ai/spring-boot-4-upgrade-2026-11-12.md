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

## Observability requirements

The separate observability change replaces Brave with Boot's OpenTelemetry starter.
Trace, log and metric exporters are off by default; mapping of inherited OpenTelemetry
environment settings is disabled. Zero ratio sampling applies even to sampled remote
parents. Local metrics and log correlation remain available. The optional
`observability` profile formats console logs as JSON without enabling network export.

Spring HTTP clients use Boot's builders, retain Jackson 2 conversion and omit full URL
attributes. Literal client paths and query strings are excluded from metric dimensions;
explicit templates are retained. HTTP URI/host dimensions are capped. Observation
logs omit method arguments. Async observations set parents before starting, record
exceptions and restore the prior worker/caller MDC on exit. Actuator metrics require
the global operator role; health probes remain public with no component details.

Backend verification after observability: 337 tests, zero assertion failures, the same
seven baseline errors and two skips. All seven added checks pass. Context tests load
actual application defaults (including the JSON-log profile), verify no exporters are
created, and verify that sampled remote parents cannot enable recording by default.
HTTP tests cover Jackson 2 trees, real observation callbacks and secret-query omission.
Management tests cover anonymous, ordinary, API-key and operator access. Live probes
are healthy and ordinary-user metric requests are refused.

The final packaged backend runs in the worktree's own ephemeral environment. Smoke:
19 passed, no skips/retries. Full e2e: 120 passed and the same three documented
database-dependent failures, no skips/retries, in 42.4 seconds.
Boot retains an idle batch-processing worker with a bounded queue even without an
exporter. No production load benchmark was performed. Collector deployment and export
activation remain a later operation for Hetzner and ECS. See
[`gendox-core-api/OBSERVABILITY.md`](../gendox-core-api/OBSERVABILITY.md) for operation,
coverage limits and future collector configuration.

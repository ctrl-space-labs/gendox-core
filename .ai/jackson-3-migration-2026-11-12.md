# Jackson 3 migration

## Scope

Use Spring Boot 4.1's default Jackson 3 mapper for MVC, Spring HTTP clients and
Hibernate JSON values. Hibernate's built-in `jackson3` format mapper is selected
explicitly because external SDKs still bring Jackson 2 and Hibernate otherwise
chooses it for JSONB. Keep the migration separate from the observability cleanup.
Use framework defaults for Java time, unknown fields and empty beans. Preserve
Hibernate proxy-property omission with a small Boot builder customizer.

Application tree models, type references and exceptions move to `tools.jackson`.
Shared annotation imports stay under `com.fasterxml.jackson.annotation`, as required
by Jackson 3. External SDK dependencies may retain their own Jackson 2 dependencies;
no application converter fallback or blanket compatibility-default switch is planned.

## Contract baseline

Before changing mapper generation, all four `@json-contract` API tests passed on
Jackson 2. They cover project field names, booleans, enums, ISO dates and unknown
fields; nested task JSONB, Unicode, null fields and merge semantics; persisted tool-call
JSON and follow-up reconstruction; omitted/null optional chat flags. Two HTTP client
tests also passed, covering JSON trees in both directions and exact provider
snake_case/schema request shapes.
These tests assert wire values, not implementation-specific mapper behavior.

## Official references

- [Spring Boot migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
- [Jackson migration guide](https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md)
- [Hibernate Jackson 3 JSON format mapper](https://docs.hibernate.org/orm/7.4/javadocs/org/hibernate/type/format/jackson/Jackson3JsonFormatMapper.html)
- [Spring Jackson 3 introduction](https://spring.io/blog/2025/10/07/introducing-jackson-3-support-in-spring/)

## Compatibility decisions

Jackson 3 detects parameter names and may choose Lombok's public all-arguments
constructor over a mutable DTO's no-argument constructor. Missing primitive values
then fail to deserialize instead of retaining the DTO's initialized defaults.
Mutable DTOs with primitive fields or initialized defaults explicitly select the
no-argument JSON creator. This also preserves initialized collections and nested
configuration defaults rather than silently replacing them with null.
Optional chat boolean fields also skip explicit nulls to retain the existing API
behavior. No global Jackson 2 defaults switch is used; Jackson 3's stricter parser
checks and other defaults remain enabled.

Project's hidden collection back-links now use `@JsonIgnore`, replacing duplicate
back-reference names that Jackson 3 rejects. Redundant managed/back-reference pairs
around already-ignored tool/skill links are removed; services explicitly own the
entity relationships. A project graph regression verifies input binding and omission
of reverse collections without changing the serialized API shape.

Additional HTTP contracts cover the Serializable embedding request, vector precision,
snake_case token usage, ignored and write-only message fields, and polymorphic
Anthropic blocks. Existing streaming tests cover provider frame reconstruction and
chat/SSE controller behavior. These tests remain in the suite as application contracts.

## Verification

- Jackson 2 baseline: four live API contracts and two HTTP client/provider contracts passed.
- Jackson 3: all six HTTP/JSON contracts passed, including vector precision, ignored and
  write-only fields, polymorphism, project graph binding and mutable DTO defaults.
- Full backend run: 338 tests, zero assertion failures, the same seven pre-existing
  errors and two skips. No additional unit errors remain.
- Live Jackson 3 API contracts: all four passed on the existing database.
- Final package/restart: four JSON API contracts passed, all 19 smoke cases passed,
  and the full e2e suite finished with 124 passes and the same three documented
  database-dependent failures in 43 seconds, without skips or retries.

The tests remain in the normal suite as version-independent application contracts.
Real provider services and ProvenAI were not contacted; no production deployment or
load benchmark is included. Existing unrelated database failures remain visible.

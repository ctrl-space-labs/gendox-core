# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Backend (gendox-core-api)
```bash
cd gendox-core-api
mvn clean install
mvn spring-boot:run

# Run all tests
mvn test

# Run a single test class
mvn test -Dtest=MyServiceTest

# Run a single test method
mvn test -Dtest=MyServiceTest#myMethod

# Run integration tests
mvn integration-test

# Run database migrations manually
mvn flyway:migrate -Durl=jdbc:postgresql://localhost:5432/gendox -Duser=admin -Dpassword=admin123
```

### Frontend (gendox-frontend)
```bash
cd gendox-frontend
yarn install
yarn dev          # http://localhost:3000
yarn build
yarn lint
yarn lint:fix
```

### End-to-End Tests (gendox-e2e-tests)
```bash
cd gendox-e2e-tests
npm install
npx playwright install
npx playwright test
npx playwright test --ui
npx playwright test --project=chromium
npx playwright test auth.spec.js          # Run a single spec file
```

### Documentation (documentation)
```bash
cd documentation
yarn install
yarn start        # http://localhost:3001
yarn build
```

### Docker
```bash
# From gendox-compose-scripts/<environment>/
docker-compose up -d                      # All services
docker-compose up -d postgres keycloak    # Dependencies only
docker-compose logs -f gendox-api
```

Available compose environments in `gendox-compose-scripts/`:
- `build-ci-installation/` — CI build (`.env.local`)
- `dev-ci-installation/` — Development CI (`.env`)
- `local-tests-installation/` — Local e2e testing (`docker-compose-with-tests.yml`)

## Architecture Overview

### Project Structure
- **gendox-core-api/**: Spring Boot 3.5.8, Java 25, Spring AI 1.0.3, QueryDSL, PostgreSQL + pgvector
- **gendox-frontend/**: Next.js 15.1.7, React 19, Material-UI 5, Redux Toolkit 2.5.0
- **gendox-keycloak/**: Custom Keycloak 25.0.4 configuration for OAuth2/OIDC
- **database/**: 98+ Flyway migration files under `src/main/resources/db/migrations/gendox-core/`
- **gendox-e2e-tests/**: Playwright with Page Object Model
- **documentation/**: Docusaurus site, deployed to Cloudflare Pages
- **gendox-compose-scripts/**: Docker Compose configurations per environment

### Development Environment URLs
- **API**: http://localhost:8080/gendox/api/v1
- **Frontend**: http://localhost:3000
- **Keycloak**: https://localhost:8443
- **Database**: localhost:5432 (`gendox` / `admin` / `admin123`)

---

## Backend Architecture

### Package Structure (`dev.ctrlspace.gendox`)
- `gendoxcoreapi/controller/` — REST controllers
- `gendoxcoreapi/services/` — business logic
- `gendoxcoreapi/model/` — JPA entities
- `gendoxcoreapi/repositories/` — Spring Data JPA + QueryDSL
- `gendoxcoreapi/converters/` — entity ↔ DTO converters
- `gendoxcoreapi/ai/engine/` — AI provider adapter layer
- `gendoxcoreapi/messages/` — AWS SQS + Postgres queue producers
- `gendoxcoreapi/configuration/` — Spring beans, `GendoxCoreApiApplication.java`
- `gendoxcoreapi/discord/` — Discord bot (JDA)
- `gendoxcoreapi/observations/` — structured logging
- `spring.batch/` — Spring Batch jobs for async document processing
- `integrations/` — external service adapters
- `provenAi/` — ProvenAI integration

### Key Patterns
- **Layered**: Controllers → Services → Repositories. No business logic in controllers.
- **Multi-tenancy**: Every data access is organization-scoped. Spring Security `@PreAuthorize` annotations enforce organization/project membership.
- **Security annotation pattern**: `@PreAuthorize("@securityUtils.hasAuthority('OP_UPDATE_PROJECT', 'getRequestedProjectIdFromPathVariable')")` — custom SpEL with operation name + method to extract context ID.
- **RESTful URL structure**: `/gendox/api/v1/organizations/{orgId}/projects/{projectId}/...`
- **AI provider abstraction**: `AiModelApiAdapterService` dispatches to OpenAI, Anthropic, Cohere, Groq, Ollama, Azure, etc. Provider env vars: `OPENAI_KEY`, `COHERE_KEY`, `GROQ_KEY`, `GEMINI_KEY`, `ANTHROPIC_KEY`, `VOYAGE_KEY`, `MISTRAL_KEY`.
- **Document pipeline**: Upload → split into sections → embed → store in pgvector → semantic search via HNSW/IVFFlat indexes.
- **Async jobs**: Spring Batch processes long-running tasks; AWS SQS carries inter-service events; ShedLock prevents duplicate job execution in multi-instance deployments.
- **Rate limiting**: Bucket4j per-API-key rate limiting.
- **Caching**: Caffeine in-process cache.
- **File parsing**: PDFBox (PDF), docx4j (Word), Apache POI (Excel).
- **Git integration**: JGit for document source tracking.

### Spring Profiles
Application configs: `application.yml`, `application-dev.yml`, `application-local.yml`, `application-docker-local.yml`, `application-prod.yml`.

Swagger UI is available at `/api-documentation` when the server is running.

### Notable Backend Features
- **Virtual threads**: Enabled (Java 21+ structured concurrency).
- **Caching**: Caffeine with 5-min expiry / 1000-item limit; custom `GendoxKeyGenerator` formats keys as `ClassName:methodName:param1:param2`.
- **Jackson**: Custom `ObjectMapper` — `JavaTimeModule` registered, dates as ISO strings (not timestamps), unknown properties ignored, Hibernate lazy-load properties excluded via MixIn.
- **HTTP client**: Spring 6 `RestClient` (not `RestTemplate`), configured in `RestClientConfiguration.java`.
- **Document upload**: Max 150 MB; supported extensions `.txt`, `.md`, `.rst`, `.pdf`, `.docx`, `.doc`, `.xls`, `.xlsx`; default split at 500 words / 768 tokens.
- **Flyway**: Disabled by default in local/dev profiles; runs automatically on startup in prod.
- **Observability**: Micrometer + Brave tracing at 100% sample rate; Prometheus metrics endpoint; Spring Boot Actuator with `show-details: always`.
- **S3 + Git integrations**: `services/integrations/` contains `GitIntegrationUpdateService`, `S3BucketIntegrationUpdateService`, `ApiIntegrationUpdateService`, orchestrated by `IntegrationManager`.

---

## Frontend Architecture

### Routing (Next.js Pages Router)
All protected pages live under `src/pages/gendox/` and are guarded by `OrganizationProjectGuard`. Public routes (`/logout`, `/accept-invitation`, `/silent-renew`) are outside `gendox/`.

**Page patterns:**
- Pages assign `PageComponent.getLayout = page => <LayoutWrapper>{page}</LayoutWrapper>` for layout composition.
- Pages expose a `pageConfig` object (e.g., `{ applyEffectiveOrgAndProjectIds: true }`) to control guard behavior.
- Client-only components (e.g., EO workspace) use `dynamic(() => import(...), { ssr: false })`.

**Guard behavior (`useOrganizationProjectGuard`):** validates in sequence — user has organizations → user belongs to org → user has projects → user belongs to project. Stores selected IDs in localStorage (`selectedOrganizationId`, `selectedProjectId`) and auto-corrects mismatched URL params.

**Next.js build:** static export mode (`output: "export"`), trailing slashes enabled, `reactStrictMode` disabled.

### Redux Store (`src/store/`)
Feature slices:
- `userData/userData.js` — authenticated user profile
- `activeOrganization/` — selected org context
- `activeProject/` — selected project context
- `activeDocument/` — selected document
- `activeProjectAgent/` — selected AI agent
- `activeTask/` + `activeTaskNode/` + `activeTaskEdge/` — task workflow editor
- `chat/gendoxChat.js` — messages and threads
- `chatAttachments/` — file upload queue
- `globalSearch/` — global search results
- `earthObservation/` — earth observation workspace

### API Service Layer (`src/gendox-sdk/`)
One service module per domain: `documentService.js`, `projectService.js`, `chatThreadService.js`, `taskService.js`, etc. All HTTP calls go through `src/configs/apiRequest.js`. Service methods accept an explicit `token` parameter and attach it as a Bearer header — never pull the token from a global singleton inside a service.

### Authentication
- OIDC via `oidc-client-ts` with Keycloak; tokens stored in localStorage.
- `src/authentication/context/AuthContext.js` exposes user/token state.
- `OrganizationProjectGuard` enforces org/project membership on the frontend.
- `IFrameMessageManagerContext` handles cross-origin messaging for embedded chat.

### Theme System (`src/@core/theme/`)
- `GendoxThemeOptions.js` — palette, spacing, typography
- `src/@core/theme/overrides/` — 31 MUI component overrides
- Always use theme tokens; avoid hardcoded colors or spacing values.

### Consistency Rules
- Mirror existing naming, folder structure, and import order.
- Use Redux Toolkit async thunks for all API calls from components.
- Integrate loading and error states for every async operation.
- Use MUI components and theme tokens; no inline styles with raw values.

### Environment Variables (Frontend)
Key variables in `gendox-frontend/.env.local`:
- `NEXT_PUBLIC_OIDC_AUTHORITY` — Keycloak realm URL
- `NEXT_PUBLIC_CLIENT_ID` — OIDC client ID
- `NEXT_PUBLIC_GENDOX_URL` — API base URL
- `NEXT_PUBLIC_GEE_CLIENT_ID` — Google Earth Engine OAuth client ID
- `NEXT_PUBLIC_MAPS_API_KEY` — Google Maps API key (used in Earth Observation map panel)
- `NEXT_PUBLIC_PROVEN_AI_URL` — ProvenAI service endpoint
- `NEXT_PUBLIC_PROVEN_AI_ENABLED` — Feature flag for ProvenAI integration

---

## Earth Observation (seaScope) Feature

A geospatial analysis workspace integrated with Google Earth Engine (GEE). Route: `/gendox/tasks/earth-observation/workspace`.

### Layout & Components
`EarthObservationLayout.js` bypasses the standard navigation sidebar. The workspace is a resizable three-panel grid managed by `WorkspaceGrid`:
- **MapPanel** — interactive Leaflet map rendering GEE map tiles
- **EditorPanel** — Monaco editor with GEE-specific syntax (via `monacoGeeProvider`)
- **ChatPanel** — AI chat embedded as an iframe (`IFrameMessageManagerContext` for cross-origin messaging)

`GeeAuthGuard` wraps the workspace and ensures a valid GEE OAuth token exists (persisted in localStorage) before rendering.

### Redux Store (`src/store/earthObservation/`)
Five layout modes: `DEFAULT`, `MAP_MAX`, `CHAT_MAX`, `EDITOR_MAX`, `MAP_MIN`. Tracks split ratios, EO scripts (with optimistic create), GEE readiness, map layers, and map center.

### EOScript Entities
Backend: `EOScript.java` → `EOScriptRepository` → `EOScriptService`. Scripts are owned by a Task and accessed via `taskService.js` (`createEOScript`, `getEOScripts`, `getLatestEOScript`). The frontend applies optimistic updates — the UI inserts a script with `id: 'optimistic'` immediately while the POST request is in flight.

### Cross-Origin IFrame Communication
`IFrameMessageManagerContext` (used by ChatPanel) coordinates parent-child frame messaging. The iframe initiates with a `gendox.events.initialization.request` event; the origin URL is passed as a `?origin=` query parameter and stored in localStorage. Use `messageManager.addHandler(eventName, handler)` to register listeners.

### ProvenAI Integration
Feature-flagged (`PROVEN_AI_ENABLED`). Main classes under `provenAi/utils/`: `ProvenAiService`, `ProvenAiAgentAuthenticationAdapter`, `ProvenAiQueryAdapter`, `UniqueIdentifierCodeService` (ISCC generation). Webhook endpoint: `ProvenAiWebHookController`. Source tracked via git repo configured in `PROVEN_AI_GIT_REPOSITORY`.

---

## Database

### Flyway Migrations
- **Location**: `database/src/main/resources/db/migrations/gendox-core/`
- **Naming**: `V[YYYYMMDD]_[HHMMSS]__Description.sql`
- **Repeatable**: `R__Description.sql` for functions/triggers
- **Demo/test data**: separate subdirectories (`demo-data/`, `test-data/`)
- Migrations are forward-only. Plan schema changes carefully before writing a migration.
- Migrations run automatically on backend startup via Flyway.

### Core Table Groups
- **Tenancy**: `organizations`, `organization_users`, `projects`, `project_users`
- **Users**: `users`, `user_types` (linked to Keycloak)
- **Documents**: `documents`, `document_instances` (with `embedding` vector column), `document_sections`
- **AI**: `ai_models`, `project_agents`, `completion_agents`
- **Chat**: `chat_threads`, `message_sections`
- **Tasks**: `tasks`, `task_nodes`
- **Subscriptions**: `subscription_plans`, `subscription_usage`
- **Integrations**: `integrations`, `organization_web_sites`, `api_keys`
- **Ops**: `audit_logs`, `spring_batch_*` tables

### Vector Search
pgvector extension; embeddings stored in `document_instances.embedding`; HNSW and IVFFlat indexes for similarity search.

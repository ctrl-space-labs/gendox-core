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
docker-compose up -d                      # All services
docker-compose up -d postgres keycloak    # Dependencies only
docker-compose logs -f gendox-api
```

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
- **RESTful URL structure**: `/gendox/api/v1/organizations/{orgId}/projects/{projectId}/...`
- **AI provider abstraction**: `AiModelApiAdapterService` dispatches to OpenAI, Anthropic, Cohere, Groq, Ollama, Azure, etc.
- **Document pipeline**: Upload → split into sections → embed → store in pgvector → semantic search via HNSW/IVFFlat indexes.
- **Async jobs**: Spring Batch processes long-running tasks; AWS SQS carries inter-service events; ShedLock prevents duplicate job execution in multi-instance deployments.
- **Rate limiting**: Bucket4j per-API-key rate limiting.
- **Caching**: Caffeine in-process cache.
- **File parsing**: PDFBox (PDF), docx4j (Word), Apache POI (Excel).
- **Git integration**: JGit for document source tracking.

### Spring Profiles
Application configs: `application.yml`, `application-dev.yml`, `application-local.yml`, `application-docker-local.yml`, `application-prod.yml`.

---

## Frontend Architecture

### Routing (Next.js Pages Router)
All protected pages live under `src/pages/gendox/` and are guarded by `OrganizationProjectGuard`. Public routes (`/logout`, `/accept-invitation`, `/silent-renew`) are outside `gendox/`.

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
One service module per domain: `documentService.js`, `projectService.js`, `chatThreadService.js`, `taskService.js`, etc. All HTTP calls go through `src/configs/apiRequest.js`.

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

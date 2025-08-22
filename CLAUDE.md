# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Global Behavior

**Memory & Context Management:**
- Always remember and use the full project architecture, tech stack, folder structure, API endpoints, Redux slices, theme system, and database structure
- Build and maintain an internal map of the app's components, state management, services, and styling tokens
- If new information is introduced during conversations, keep it in memory and adjust future answers accordingly
- Continuously update understanding of component relationships, data flows, and integration patterns

## Common Development Commands

### Backend (gendox-core-api)
```bash
# Build and run the Spring Boot API
cd gendox-core-api
mvn clean install
mvn spring-boot:run

# Run database migrations
mvn flyway:migrate -Durl=jdbc:postgresql://localhost:5432/gendox -Duser=admin -Dpassword=admin123

# Run tests
mvn test
mvn integration-test
```

### Frontend (gendox-frontend)
```bash
# Development server
cd gendox-frontend
yarn install
yarn dev          # Starts development server on http://localhost:3000

# Production build
yarn build
yarn start

# Linting and formatting
yarn lint         # Run ESLint
yarn lint:fix     # Auto-fix linting issues
```

### End-to-End Tests (gendox-e2e-tests)
```bash
cd gendox-e2e-tests
npm install
npx playwright install
npx playwright test --ui              # Run with UI mode
npx playwright test --project=chromium # Run single browser
npx playwright test auth.spec.js       # Run specific test file
```

### Documentation (documentation)
```bash
cd documentation
yarn install
yarn start        # Development server
yarn build        # Production build
```

### Docker Development Environment
```bash
# Start all services (recommended for development)
docker-compose up -d

# Start specific services
docker-compose up -d postgres keycloak
docker-compose up -d gendox-api
docker-compose up -d gendox-frontend

# View logs
docker-compose logs -f gendox-api
```

## Architecture Overview

### Project Structure
- **gendox-core-api/**: Spring Boot backend API with Java 21, PostgreSQL, Spring Security, Spring AI
- **gendox-frontend/**: Next.js 15.1.7 React 19 application with Material-UI 5, Redux Toolkit 2.5.0, OIDC authentication
- **gendox-keycloak/**: Custom Keycloak 25.0.4 configuration for OAuth2/OIDC authentication  
- **database/**: PostgreSQL with pgvector extension, Flyway migrations (80+ migration files)
- **gendox-e2e-tests/**: Playwright test suite with Page Object Model pattern
- **documentation/**: Docusaurus-based documentation site
- **gendox-compose-scripts/**: Docker Compose configurations for different environments

### Key Technologies
- **Backend**: Spring Boot 3.4.5, Spring AI 1.0.0-M6, QueryDSL, PostgreSQL + pgvector
- **Frontend**: Next.js 15.1.7, React 19, Material-UI 5, Redux Toolkit 2.5.0, React-Redux 9.2.0, ApexCharts
- **Authentication**: Keycloak 25.0.4 with OAuth2/JWT tokens
- **AI Integration**: Multi-provider support (OpenAI, Anthropic, Cohere, Groq, Ollama, etc.)
- **Database**: PostgreSQL with pgvector extension, vector embeddings for semantic search, organization-based multi-tenancy

### Frontend Architecture Patterns (Next.js 15.1.7 + React 19 + Redux Toolkit)

**Next.js Framework:**
- **Pages Router**: File-system based routing in `src/pages/`
- **API Routes**: Server-side API endpoints (if used)
- **Static Generation**: Build-time page generation where applicable
- **Server Components**: React 19 server components support

**Redux Toolkit State Management:**
- **Store Configuration**: Centralized store in `src/store/index.js`
- **Slices**: Feature-based slices in `src/store/` directories:
  - `activeDocument/activeDocument.js`
  - `activeOrganization/activeOrganization.js` 
  - `activeProject/activeProject.js`
  - `activeTask/activeTask.js`
  - `chat/gendoxChat.js`
  - `globalSearch/globalSearch.js`
  - `userData/userData.js`
- **Async Thunks**: Redux Toolkit async actions for API calls
- **RTK Query**: Used for caching and data fetching (where implemented)

**Component Architecture:**
- **Feature-based Organization**: Components organized by feature under `src/views/pages/`
- **Layout Components**: Reusable layouts in `src/layouts/`
- **Custom Components**: Shared components in `src/views/custom-components/`
- **Context Providers**: React contexts in `src/contexts/` and `src/authentication/context/`

**API Layer & Services:**
- **Custom SDK**: Complete API abstraction in `src/gendox-sdk/` with service modules:
  - `taskService.js`, `documentService.js`, `projectService.js`, etc.
- **HTTP Client**: Centralized API request configuration in `src/configs/apiRequest.js`
- **Service Pattern**: Each feature has dedicated service modules

**Authentication & Authorization:**
- **OIDC Provider**: OAuth2/OpenID Connect integration with Keycloak
- **Auth Context**: `src/authentication/context/AuthContext.js`
- **Route Guards**: Protected routes with `OrganizationProjectGuard`, `PrivateRoute`
- **Token Management**: Automatic token refresh and storage
- **Multi-tenancy**: Organization-based access control

**Material-UI Integration:**
- **Theme System**: Custom theme in `src/@core/theme/` with `GendoxThemeOptions.js`
- **Component Overrides**: Theme overrides in `src/@core/theme/overrides/`
- **Responsive Design**: MUI breakpoints and responsive utilities
- **Dark/Light Mode**: Dynamic theme switching support

**Routing & Navigation:**
- **File-system Routing**: Next.js pages in `src/pages/gendox/`
- **Protected Routes**: Authentication-based route access
- **Dynamic Routes**: Parameterized routes for organizations/projects
- **Vertical Navigation**: Sidebar navigation in `src/navigation/vertical/`

### Backend Architecture Patterns
- **Layered Architecture**: Controllers → Services → Repositories
- **Domain Models**: Separate entities, DTOs, and converters
- **Multi-tenancy**: Organization-scoped data access with security filters
- **AI Integration**: Document processing pipeline with vector embeddings
- **Batch Processing**: Spring Batch for long-running AI operations
- **Event-Driven**: AWS SQS integration for async processing

### Database Design & Flyway Migrations

**Database Structure (PostgreSQL + pgvector):**
- **Location**: `/database/src/main/resources/db/migrations/`
- **Migration Files**: 80+ Flyway migration files organized chronologically
- **Schema Management**: Version-controlled database evolution since 2023

**Core Database Tables:**
- **User & Organization Management**:
  - `organizations` - Multi-tenant organization structure
  - `organization_users` - User-organization relationships with roles
  - `projects` - Organization projects
  - `project_users` - Project-level permissions
  - `users` - User profiles (linked to Keycloak)
  - `user_types` - User role definitions

- **Document Management**:
  - `documents` - Document metadata and storage references  
  - `document_instances` - Document embeddings and vector storage
  - `document_sections` - Document content chunking for processing
  - `temp_integration_files` - Temporary file processing

- **AI & Processing**:
  - `ai_models` - Supported AI model configurations (OpenAI, Anthropic, Cohere, etc.)
  - `project_agents` - AI agent configurations per project
  - `completion_agents` - AI completion settings
  - `chat_threads` - Conversation threads
  - `message_sections` - Chat message storage

- **Task & Workflow System**:
  - `tasks` - Document processing tasks
  - `task_nodes` - Individual task execution nodes
  - `audit_logs` - System activity tracking
  - `spring_batch_*` - Spring Batch job execution tables

- **Integration & External Services**:
  - `integrations` - External service configurations
  - `organization_web_sites` - Website integration settings
  - `api_keys` - API key management
  - `subscription_plans` - Pricing and usage limits
  - `subscription_usage` - Usage tracking

**Flyway Migration Categories:**
- **Core Schema**: `V20230807_*` - Initial database structure
- **AI Models**: `V202311*_*`, `V202407*_*` - AI provider integrations
- **User Management**: `V202310*_*`, `V202405*_*` - Authentication & authorization
- **Document Processing**: `V202311*_*`, `V202501*_*` - Document handling improvements
- **Subscription System**: `V202408*_*` - Pricing and usage tracking
- **Task System**: `V20250621_*` - New task and action framework
- **Integrations**: `V202411*_*` - External service connections

**Vector Search (pgvector):**
- **Extension**: pgvector for semantic similarity search
- **Embedding Storage**: `document_instances.embedding` column
- **Index Types**: HNSW and IVFFlat indexes for performance
- **Search Capabilities**: Semantic document search and retrieval

**Database Configuration:**
- **Environments**: Separate configurations for dev, prod, e2e, local
- **Connection Pooling**: Configured via application profiles
- **Migrations**: Automated via Flyway during application startup
- **Indexes**: Optimized for main query patterns (added V20240808)

**Migration Patterns:**
- **Versioned Migrations**: `V[YYYYMMDD]_[HHMMSS]__Description.sql`
- **Repeatable Migrations**: `R__Description.sql` for functions/triggers
- **Demo/Test Data**: Separate migration files for development data
- **Rollback Strategy**: Forward-only migrations with careful planning

### Development Workflow
1. **Local Setup**: Use `docker-compose up -d` to start all dependencies
2. **API Development**: Run Spring Boot with `mvn spring-boot:run` or IDE
3. **Frontend Development**: Run Next.js with `yarn dev` for hot reloading
4. **Testing**: Use Playwright for E2E tests, JUnit for backend unit tests
5. **Documentation**: Use Docusaurus for user and developer documentation

### Authentication Flow
- **Frontend**: OIDC Client → Keycloak → JWT tokens stored in localStorage
- **Backend**: Spring Security validates JWT tokens with Keycloak public key
- **API Calls**: Bearer token authentication with organization context

### AI Feature Architecture
- **Document Processing**: Upload → Split → Embed → Store in vector DB
- **Chat System**: Thread-based conversations with message history
- **Provider Abstraction**: Unified interface for multiple AI providers
- **Semantic Search**: Vector similarity search using pgvector
- **Tool Integration**: Support for external API calls and custom functions

### Testing Strategy
- **E2E Tests**: Playwright with fixtures for authentication and data setup
- **API Tests**: Spring Boot Test with TestContainers for integration tests
- **Frontend Tests**: Component testing with React Testing Library (when present)
- **Database Tests**: Flyway migrations with version control

### Configuration Management
- **Environment Variables**: Centralized in `application.yml` and `docker-compose.yml`
- **Profiles**: Development, testing, and production Spring profiles
- **Secrets**: External configuration for API keys and sensitive data
- **Feature Flags**: Environment-based feature toggles

### Key Integration Points
- **AWS S3**: Document storage and file management
- **AWS SQS**: Async job processing and event handling
- **Keycloak**: User authentication and authorization
- **Multiple AI Providers**: OpenAI, Anthropic, Cohere, Azure OpenAI, etc.
- **Vector Database**: PostgreSQL with pgvector for embeddings

### Development Environment URLs
- **API**: http://localhost:8080/gendox/api/v1
- **Frontend**: http://localhost:3000
- **Keycloak**: https://localhost:8443
- **Database**: localhost:5432 (gendox/admin/admin123)
- **Documentation**: http://localhost:3001

## Code Documentation Requirements

Every time you generate or modify code in this project, you must also:

1. **Provide the full file structure** of the relevant part of the app
2. **Include a summary of the app's styling details**, including margins, paddings, spacing, and any global styles
3. **If you create or modify a component**, explain how it fits into the app's structure and styling system

Always output these after code changes without the user asking.

## Consistency Rules

**Code Standards & Conventions:**
- Always mirror existing naming, folder structure, import order, and file organization
- Follow Next.js + React + Material-UI + Redux Toolkit conventions already present in the repository
- Use the centralized theme for styling — no hardcoded values unless absolutely required
- Use reusable components whenever possible instead of creating new ones
- Always integrate error handling and loading states for API calls
- Respect accessibility and responsiveness when using Material-UI components
- Maintain consistent TypeScript/JavaScript patterns as established in the codebase

## Response Format Requirements

**Claude's answers must always include, in this order:**

1. **Code Changes** → Full, clean, and ready-to-paste code with proper imports and exports
2. **File Structure** → Show the relevant part of the project tree with new/updated files highlighted  
3. **Styling & Theme Context** → Margins, paddings, spacing units, colors, typography, and which MUI tokens are used
4. **Integration Explanation** → Where the code fits, which components use it, and how it interacts with Redux, API services, or Keycloak
5. **Impact & Risks** → Any breaking changes, dependencies affected, database migrations needed, or potential conflicts
6. **Next Steps** → Suggest 1–3 follow-up actions if needed (testing, deployment considerations, etc.)

## Global Context Commands

**The user can invoke these commands at any time:**

- **`/sync`** → Summarize the current architecture in ≤10 bullets
- **`/map`** → Output a module/file structure map of the relevant areas
- **`/contracts`** → List known API endpoints and response shapes
- **`/theme`** → Show spacing, color, and typography tokens from the MUI theme
- **`/touches`** → List which files will be modified or created for the current task
- **`/undo-plan`** → Suggest a safe revert plan for the latest changes
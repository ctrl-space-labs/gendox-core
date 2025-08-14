# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **gendox-frontend/**: Next.js 15 React application with Material-UI, Redux Toolkit, OIDC authentication
- **gendox-keycloak/**: Custom Keycloak configuration for OAuth2/OIDC authentication
- **database/**: PostgreSQL with pgvector extension, Flyway migrations
- **gendox-e2e-tests/**: Playwright test suite with Page Object Model pattern
- **documentation/**: Docusaurus-based documentation site
- **gendox-compose-scripts/**: Docker Compose configurations for different environments

### Key Technologies
- **Backend**: Spring Boot 3.4.5, Spring AI 1.0.0-M6, QueryDSL, PostgreSQL + pgvector
- **Frontend**: Next.js 15.1.7, React 19, MUI 5, Redux Toolkit, ApexCharts
- **Authentication**: Keycloak 25.0.4 with OAuth2/JWT
- **AI Integration**: Multi-provider support (OpenAI, Anthropic, Cohere, etc.)
- **Database**: Vector embeddings for semantic search, organization-based multi-tenancy

### Frontend Architecture Patterns
- **Component Structure**: Feature-based organization under `src/views/pages/`
- **State Management**: Redux slices in `src/store/` with async thunks
- **API Layer**: Custom SDK in `src/gendox-sdk/` with service modules
- **Authentication**: OIDC context provider with automatic token management
- **Theming**: Centralized MUI theme with light/dark mode support
- **Routing**: Next.js file-system routing with protected routes

### Backend Architecture Patterns
- **Layered Architecture**: Controllers → Services → Repositories
- **Domain Models**: Separate entities, DTOs, and converters
- **Multi-tenancy**: Organization-scoped data access with security filters
- **AI Integration**: Document processing pipeline with vector embeddings
- **Batch Processing**: Spring Batch for long-running AI operations
- **Event-Driven**: AWS SQS integration for async processing

### Database Design
- **Core Tables**: organizations, projects, documents, ai_models, conversations
- **AI Tables**: document_instances (for embeddings), completion_agents, conversations
- **User Management**: Integrated with Keycloak via user references
- **Vector Storage**: pgvector extension for semantic search capabilities

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
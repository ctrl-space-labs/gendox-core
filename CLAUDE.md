# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gendox is a no-code AI platform that enables organizations to create intelligent chat agents from their existing documents and information. The platform consists of multiple components working together to provide document ingestion, processing, embedding generation, and conversational AI capabilities.

## Architecture

This is a **multi-module microservices architecture** with the following main components:

### Core Components
- **gendox-core-api/** - Spring Boot REST API backend (Java 21)
- **gendox-frontend/** - Next.js React frontend with Material-UI
- **gendox-keycloak/** - Keycloak identity provider for authentication
- **database/** - PostgreSQL with pgvector extension and Flyway migrations
- **gendox-e2e-tests/** - Playwright end-to-end tests

### Supporting Components
- **documentation/** - Docusaurus documentation site
- **gendox-compose-scripts/** - Docker Compose configurations for different environments

## Development Commands

### Backend (Spring Boot API)
```bash
# From gendox-core-api/ directory
mvn clean install          # Build the API
mvn spring-boot:run        # Run the API (requires database setup)
mvn test                   # Run tests
```

### Frontend (Next.js)
```bash
# From gendox-frontend/ directory
npm install               # Install dependencies
npm run dev              # Run development server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
```

### Database Setup
```bash
# From database/ directory - set up PostgreSQL with pgvector
mvn clean install flyway:info -Durl=jdbc:postgresql://localhost:5432/postgres -Duser=[user] -Dpassword=[pass]
```

### End-to-End Tests
```bash
# From gendox-e2e-tests/ directory
npx playwright test       # Run Playwright tests
```

### Documentation
```bash
# From documentation/ directory
npm start                # Run Docusaurus dev server
npm run build            # Build documentation
```

### Docker Development
```bash
docker-compose up         # Run full stack with Docker
```

## Key Architecture Patterns

### Backend Architecture
- **Domain-Driven Design**: Organized around business domains (authentication, documents, chat, etc.)
- **Service Layer Pattern**: Business logic in services, data access in repositories
- **Spring Security + OAuth2**: JWT-based authentication with Keycloak integration
- **QueryDSL**: Type-safe database queries with JPA
- **Spring Batch**: Background job processing for document processing and training

### Key Backend Packages
- `authentication/` - JWT and OAuth2 security implementation
- `controller/` - REST API endpoints
- `services/` - Business logic layer
- `repositories/` - Data access with QueryDSL predicates
- `model/` - JPA entities and DTOs
- `ai/engine/` - AI model integrations (OpenAI, Anthropic, Cohere, etc.)
- `spring/batch/` - Background job processing

### Frontend Architecture
- **Next.js App Router**: File-based routing with React 19
- **Redux Toolkit**: State management for authentication, projects, chat
- **Material-UI v5**: Component library with custom theming
- **OIDC Authentication**: Integration with Keycloak using oidc-client-ts

### Key Frontend Directories
- `pages/` - Next.js page components and routing
- `views/` - Reusable view components organized by feature
- `store/` - Redux slices for state management
- `gendox-sdk/` - API client services
- `authentication/` - Auth context and guards

## Database & AI Integration

- **PostgreSQL with pgvector**: Vector similarity search for embeddings
- **Flyway Migrations**: Database schema versioning in `database/src/main/resources/`
- **Multiple AI Providers**: OpenAI, Anthropic, Cohere, Groq, Gemini, Mistral, Voyage
- **Document Processing**: PDF, DOCX, TXT, MD with various splitting strategies
- **Vector Embeddings**: Document sections converted to embeddings for semantic search

## Configuration

### Environment Variables (Backend)
Key environment variables for the Spring Boot API:
- `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`
- AI provider keys: `OPENAI_KEY`, `ANTHROPIC_KEY`, `COHERE_KEY`, etc.
- Email: `GENDOX_SPRING_EMAIL_*` variables

### Application Profiles
- `application-local.yml` - Local development
- `application-dev.yml` - Development environment  
- `application-prod.yml` - Production environment

## Testing Strategy

- **Unit Tests**: Java unit tests with JUnit 5
- **Integration Tests**: Spring Boot test slices
- **E2E Tests**: Playwright tests in `gendox-e2e-tests/`
- **API Testing**: REST API endpoints tested with Playwright

## Development Workflow

1. **Database First**: Set up PostgreSQL with pgvector extension
2. **Backend Development**: Spring Boot API with proper authentication setup
3. **Frontend Development**: Next.js with Material-UI components
4. **Integration**: Full-stack development with Docker Compose
5. **Testing**: Unit tests, integration tests, and E2E tests

## Common Development Tasks

### Adding New AI Model Provider
1. Create converter in `ai/engine/converters/`
2. Add configuration in `application.yml`
3. Update service classes to handle new provider
4. Add environment variables for API keys

### Adding New Document Type
1. Update `FileTypeConstants.java`
2. Add processing logic in document services
3. Update frontend file upload components

### Database Schema Changes
1. Create Flyway migration in `database/src/main/resources/db/migration/`
2. Update JPA entities in `model/` package
3. Regenerate QueryDSL Q-classes if needed
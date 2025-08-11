---
sidebar_position: 3
---

# Installation Guide

This guide covers different installation methods for Gendox, from using the hosted cloud service to deploying your own instance locally or in production.

## Quick Start: Cloud Hosted (Recommended)

The fastest way to get started with Gendox is to use our hosted cloud service:

1. **Visit [app.gendox.dev](https://app.gendox.dev)**
2. **Sign up for a free account**
3. **Start creating your AI agents immediately**

✅ **Advantages:**
- No installation required
- Always up-to-date
- Automatic backups and maintenance
- Enterprise-grade security
- Free tier available

## Local Development Setup

For developers who want to contribute to Gendox or customize the platform:

### Prerequisites

- **Docker**: Version 20.0+ with Docker Compose
- **Git**: For cloning the repository
- **System Requirements**: 8GB RAM minimum, 16GB recommended

### Step 1: Clone Repository

```bash
git clone https://github.com/ctrl-space-labs/gendox-core.git
cd gendox-core
```

### Step 2: Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables:

```bash
# AI Provider Keys (at least one required)
OPENAI_KEY=your_openai_api_key
ANTHROPIC_KEY=your_anthropic_api_key
COHERE_KEY=your_cohere_api_key

# Database Configuration (auto-configured in Docker)
DATABASE_URL=jdbc:postgresql://postgres:5432/gendoxdb
DATABASE_USERNAME=gendoxuser
DATABASE_PASSWORD=gendoxpassword

# Keycloak Configuration (auto-configured in Docker)
KEYCLOAK_CLIENT_ID=gendox-client
KEYCLOAK_CLIENT_SECRET=auto-generated

# Email Configuration (optional for local dev)
GENDOX_SPRING_EMAIL_HOST=smtp.gmail.com
GENDOX_SPRING_EMAIL_PORT=587
GENDOX_SPRING_EMAIL_USERNAME=your_email@gmail.com
GENDOX_SPRING_EMAIL_PASSWORD=your_app_password
```

### Step 3: Start Services

```bash
docker-compose up -d
```

This will start:
- **PostgreSQL**: Database with pgvector extension
- **Keycloak**: Authentication service
- **Spring Boot API**: Backend services
- **Next.js Frontend**: Web application
- **Redis**: Caching layer (optional)

### Step 4: Verify Installation

Check that all services are running:

```bash
docker-compose ps
```

You should see all services in "Up" state.

### Step 5: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/gendox/api/v1
- **API Documentation**: http://localhost:8080/gendox/api/v1/swagger-ui/index.html
- **Keycloak Admin**: http://localhost:8180/admin (admin/admin)

### Development Workflow

For active development, you can run services individually:

#### Backend Development

```bash
# Terminal 1: Start database and dependencies
docker-compose up postgres keycloak redis

# Terminal 2: Run Spring Boot API
cd gendox-core-api
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

#### Frontend Development

```bash
# Terminal 3: Run Next.js in development mode
cd gendox-frontend
npm install
npm run dev
```

## Source Code Setup (Advanced)

For maximum customization and contribution:

### Prerequisites

- **Java**: OpenJDK 21 or Oracle JDK 21
- **Node.js**: Version 18+ with npm
- **PostgreSQL**: Version 15+ with pgvector extension
- **Keycloak**: Version 25+
- **Maven**: Version 3.9+
- **Git**: Latest version

### Step 1: Database Setup

Install PostgreSQL with pgvector:

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-15 postgresql-contrib
sudo apt-get install postgresql-15-pgvector

# macOS with Homebrew
brew install postgresql@15
brew install pgvector

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

Create database and user:

```sql
CREATE USER gendoxuser WITH PASSWORD 'gendoxpassword';
CREATE DATABASE gendoxdb OWNER gendoxuser;
\c gendoxdb;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 2: Keycloak Setup

Download and configure Keycloak:

```bash
wget https://github.com/keycloak/keycloak/releases/download/25.0.6/keycloak-25.0.6.zip
unzip keycloak-25.0.6.zip
cd keycloak-25.0.6

# Start Keycloak
bin/kc.sh start-dev --http-port 8180
```

Import Gendox realm configuration:

```bash
bin/kc.sh import --file ../gendox-keycloak/realm-export.json
```

### Step 3: Backend Setup

```bash
cd gendox-core-api

# Run database migrations
mvn clean install flyway:migrate -Durl=jdbc:postgresql://localhost:5432/gendoxdb -Duser=gendoxuser -Dpassword=gendoxpassword

# Build and run the API
mvn clean install
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Step 4: Frontend Setup

```bash
cd gendox-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment

### Docker Compose (Small to Medium Deployments)

For production deployment using Docker Compose:

```bash
# Production docker-compose file
docker-compose -f docker-compose.prod.yml up -d
```

Key production considerations:
- Use external PostgreSQL database
- Configure proper secrets management
- Set up SSL/TLS certificates
- Configure backup strategies
- Monitor resource usage

### Kubernetes (Large Scale Deployments)

Helm chart for Kubernetes deployment:

```bash
# Add Gendox Helm repository
helm repo add gendox https://charts.gendox.dev

# Install Gendox
helm install gendox gendox/gendox-platform \
  --set postgresql.enabled=true \
  --set keycloak.enabled=true \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=your-domain.com
```

### Cloud Providers

#### AWS Deployment

Use the provided CloudFormation template:

```bash
# Deploy infrastructure
aws cloudformation create-stack \
  --stack-name gendox-infrastructure \
  --template-body file://aws-infrastructure.yaml \
  --parameters ParameterKey=DomainName,ParameterValue=your-domain.com
```

#### Google Cloud Platform

Deploy using Google Cloud Run and Cloud SQL:

```bash
# Deploy using gcloud
gcloud run deploy gendox-api \
  --image gcr.io/your-project/gendox-api:latest \
  --platform managed \
  --region us-central1
```

#### Microsoft Azure

Deploy using Azure Container Instances:

```bash
# Deploy to Azure
az container create \
  --resource-group gendox-rg \
  --name gendox-platform \
  --image your-registry/gendox:latest
```

## Configuration

### Environment Variables Reference

#### Required Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `jdbc:postgresql://localhost:5432/gendoxdb` |
| `DATABASE_USERNAME` | Database username | `gendoxuser` |
| `DATABASE_PASSWORD` | Database password | - |
| `KEYCLOAK_SERVER_URL` | Keycloak server URL | `http://localhost:8180` |
| `KEYCLOAK_REALM` | Keycloak realm name | `gendox` |

#### AI Provider Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_KEY` | OpenAI API key | At least one |
| `ANTHROPIC_KEY` | Anthropic API key | AI provider |
| `COHERE_KEY` | Cohere API key | key required |
| `GOOGLE_API_KEY` | Google AI API key | |
| `GROQ_API_KEY` | Groq API key | |

#### Optional Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Backend server port | `8080` |
| `FRONTEND_PORT` | Frontend server port | `3000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `AWS_S3_BUCKET` | S3 bucket for file storage | - |

### Application Profiles

- **`local`**: Local development with minimal external dependencies
- **`dev`**: Development environment with external services
- **`staging`**: Pre-production testing environment
- **`prod`**: Production environment with all optimizations

## Troubleshooting

### Common Issues

#### Port Conflicts

If ports are already in use:

```bash
# Check which process is using port 8080
lsof -i :8080

# Kill the process if needed
kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if pgvector extension is available
psql -d gendoxdb -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Memory Issues

Increase Docker memory limits:

```yaml
# docker-compose.yml
services:
  gendox-api:
    environment:
      - JAVA_OPTS=-Xmx2g -Xms1g
```

#### Permission Issues

Fix file permissions:

```bash
sudo chown -R $USER:$USER ./gendox-core
chmod +x scripts/*.sh
```

### Getting Help

- **Documentation**: Comprehensive guides available
- **Discord**: [Join our community](https://discord.gg/jWes2urauW)
- **GitHub Issues**: [Report problems](https://github.com/ctrl-space-labs/gendox-core/issues)
- **Email Support**: contact@ctrlspace.dev

## Next Steps

Once Gendox is installed and running:

1. **[Quick Start Guide](quick-start)**: Create your first AI agent
2. **[User Manual](../user-manual/registration)**: Learn how to use the platform
3. **[API Documentation](../api/overview)**: Integrate with external systems
4. **[Developer Guide](../developer-guide/backend-development)**: Contribute to the project

## Security Considerations

### Production Security Checklist

- [ ] Change default passwords and secrets
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Set up firewall rules and network security
- [ ] Enable audit logging and monitoring
- [ ] Configure backup and disaster recovery
- [ ] Regular security updates and patches
- [ ] API rate limiting and DDoS protection
- [ ] Database encryption at rest
- [ ] Secure secret management (e.g., HashiCorp Vault)

### Compliance and Privacy

- **GDPR Compliance**: Configure data retention policies
- **SOC 2**: Available for enterprise deployments
- **HIPAA**: Healthcare compliance configuration available
- **Data Residency**: Deploy in your preferred geographic region

Ready to start building AI agents? Continue with the [Quick Start Guide](quick-start)! 🚀
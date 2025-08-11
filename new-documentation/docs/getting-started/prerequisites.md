# Prerequisites

Before you can start using or developing with Gendox, make sure you have the necessary prerequisites for your intended use case.

## For End Users

If you're planning to use the hosted version of Gendox, you only need:

- ✅ **Modern Web Browser** (Chrome, Firefox, Safari, Edge)
- ✅ **Email Address** for account registration
- ✅ **Internet Connection**

That's it! You can start using Gendox at [app.gendox.dev](https://app.gendox.dev) right away.

## For Docker Deployment

To run Gendox locally using Docker (recommended for development and testing):

### Required Software

- ✅ **Docker** (version 20.10 or later)
- ✅ **Docker Compose** (version 2.0 or later)
- ✅ **Git** (for cloning the repository)

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: At least 10GB free space
- **CPU**: 2+ cores recommended
- **OS**: Linux, macOS, or Windows with WSL2

### Installation Commands

#### On Ubuntu/Debian:
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and log back in, or run:
newgrp docker
```

#### On macOS:
```bash
# Install Docker Desktop
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

#### On Windows:
Download and install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

### Verify Installation
```bash
docker --version
docker compose version
```

## For Source Code Development

If you want to run Gendox from source code or contribute to the project:

### Backend Development (Spring Boot API)

#### Required Software
- ✅ **Java Development Kit (JDK) 21**
- ✅ **Apache Maven** (3.8 or later)
- ✅ **PostgreSQL** (15 or later)
- ✅ **Git**

#### Java 21 Installation

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install openjdk-21-jdk maven
```

**On macOS:**
```bash
# Using Homebrew
brew install openjdk@21 maven

# Add to PATH
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
```

**On Windows:**
Download and install from [Oracle JDK 21](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK 21](https://jdk.java.net/21/)

#### Maven Installation Verification
```bash
java --version
mvn --version
```

#### PostgreSQL Setup

**Install PostgreSQL with pgvector extension:**

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo apt install postgresql-15-pgvector

# macOS
brew install postgresql@15
brew install pgvector

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS
```

**Create Database:**
```sql
CREATE DATABASE gendox_db;
CREATE USER gendox_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gendox_db TO gendox_user;

-- Enable pgvector extension
\c gendox_db
CREATE EXTENSION vector;
```

### Frontend Development (Next.js)

#### Required Software
- ✅ **Node.js** (18.17 or later)
- ✅ **npm** (comes with Node.js)

#### Node.js Installation

**Using Node Version Manager (recommended):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18
nvm install 18
nvm use 18
```

**Direct Installation:**
- **Ubuntu/Debian:** `sudo apt install nodejs npm`
- **macOS:** `brew install node`
- **Windows:** Download from [nodejs.org](https://nodejs.org/)

#### Verify Installation
```bash
node --version  # Should be 18.17+
npm --version
```

## AI Model API Keys

To use AI features, you'll need API keys from at least one AI provider:

### Supported Providers

| Provider | Required for | Get API Key |
|----------|--------------|-------------|
| **OpenAI** | Chat completion, embeddings | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | Claude models | [console.anthropic.com](https://console.anthropic.com/) |
| **Cohere** | Embeddings, reranking | [dashboard.cohere.com](https://dashboard.cohere.com/api-keys) |
| **Groq** | Fast inference | [console.groq.com](https://console.groq.com/keys) |
| **Google Gemini** | Gemini models | [ai.google.dev](https://ai.google.dev/) |
| **Mistral AI** | Mistral models | [console.mistral.ai](https://console.mistral.ai/) |
| **Voyage AI** | Embeddings | [dash.voyageai.com](https://dash.voyageai.com/) |

### Environment Variables

Create a `.env` file with your API keys:

```bash
# AI Model API Keys
OPENAI_KEY=your_openai_api_key
ANTHROPIC_KEY=your_anthropic_api_key
COHERE_KEY=your_cohere_api_key
GROQ_KEY=your_groq_api_key
GEMINI_KEY=your_gemini_api_key
MISTRAL_KEY=your_mistral_api_key
VOYAGE_KEY=your_voyage_api_key

# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/gendox_db
DATABASE_USERNAME=gendox_user
DATABASE_PASSWORD=your_password

# Keycloak Configuration (for local development)
KEYCLOAK_CLIENT_ID=gendox-client
KEYCLOAK_CLIENT_SECRET=your_client_secret
```

## Optional Tools

These tools can enhance your development experience:

### Code Editors/IDEs
- **IntelliJ IDEA** (recommended for Java development)
- **Visual Studio Code** (great for frontend and general development)
- **Eclipse** (alternative Java IDE)

### Database Tools
- **pgAdmin** - PostgreSQL administration
- **DBeaver** - Universal database client
- **DataGrip** - JetBrains database IDE

### API Testing
- **Postman** - API development and testing
- **Insomnia** - Alternative REST client
- **curl** - Command-line HTTP client

## Next Steps

Once you have the prerequisites installed:

1. **For Docker deployment**: Continue to [Installation Guide](installation)
2. **For source development**: Check out the [Developer Guide](../developer-guide/architecture)
3. **For quick start**: Jump to [Quick Start Guide](quick-start)

## Troubleshooting

### Common Issues

**Java Version Conflicts:**
```bash
# Check which Java version is active
java --version
which java

# Set JAVA_HOME if needed
export JAVA_HOME=/path/to/java21
```

**Node.js Version Issues:**
```bash
# Use specific Node.js version
nvm use 18

# Set as default
nvm alias default 18
```

**PostgreSQL Connection Issues:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U gendox_user -d gendox_db
```

**Docker Permission Issues:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker
```

Need help? Join our [Discord community](https://discord.gg/jWes2urauW) for support! 🚀
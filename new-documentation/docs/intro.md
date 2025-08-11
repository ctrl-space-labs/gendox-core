# Welcome to Gendox Documentation

Welcome to the comprehensive documentation for **Gendox**, a powerful enterprise-grade AI platform that transforms your documents and knowledge into intelligent, conversational AI agents. Built with cutting-edge RAG (Retrieval-Augmented Generation) technology, Gendox enables organizations to create sophisticated AI assistants that understand and respond based on their specific content and context.

![Gendox Logo](/img/gendox-logo-final-01.png)

## What is Gendox?

Gendox is an advanced **no-code/low-code AI platform** that leverages Retrieval-Augmented Generation (RAG) to create intelligent chat agents from your existing documents and information. Unlike generic AI assistants, Gendox agents are trained specifically on your content, ensuring accurate, contextual, and domain-specific responses.

### Core Capabilities

- **🎯 Domain-Specific AI Agents**: Train AI assistants with your proprietary documents, manuals, and knowledge bases
- **🧠 Advanced RAG Technology**: Combines semantic search with large language models for accurate, contextual responses  
- **🔄 Multi-Model Architecture**: Leverage the best AI models from OpenAI, Anthropic, Google, and more
- **🏢 Enterprise-Ready**: Multi-tenant architecture with robust security, authentication, and access controls
- **📈 Scalable Infrastructure**: Handle everything from small teams to enterprise-wide deployments
- **🔌 Extensive Integrations**: Deploy anywhere with APIs, widgets, Discord bots, and more

## Architecture Overview

Gendox is built on a modern, microservices architecture designed for scalability and reliability:

### **Frontend Application**
- **Next.js 15** with React 19 and TypeScript
- **Material-UI v5** for consistent, professional interface
- **Redux Toolkit** for state management
- **Real-time chat interface** with streaming responses
- **Advanced document editor** with markdown support

### **Backend API**
- **Spring Boot 3.x** with Java 21
- **RESTful API** with comprehensive OpenAPI documentation
- **OAuth2/OIDC authentication** via Keycloak integration
- **Microservices architecture** for modularity and scaling

### **AI & ML Infrastructure**
- **PostgreSQL with pgvector** for vector similarity search
- **Multi-provider AI integration** for flexibility and redundancy
- **Advanced document processing** pipeline
- **Real-time embedding generation** and semantic search

## Key Features

### 🤖 **Multi-Model AI Support**

Gendox supports the industry's leading AI models, giving you flexibility to choose the best model for your use case:

#### **Completion Models (Text Generation)**
- **OpenAI**: GPT-4, GPT-4-turbo, GPT-4-omni, GPT-4-omni-mini, O1-mini, GPT-3.5-turbo
- **Anthropic**: Claude-3 Opus, Claude-3 Sonnet, Claude-3 Haiku, Claude-3.5 Sonnet
- **Google**: Gemini Pro, Gemini Pro Vision, Gemini Flash
- **Groq**: Llama-3-8B, Llama-3-70B (ultra-fast inference)
- **Mistral AI**: Mistral-7B, Mixtral-8x7B
- **Ollama**: Local model deployment support

#### **Embedding Models (Semantic Search)**
- **OpenAI**: text-embedding-ada-002, text-embedding-3-small, text-embedding-3-large
- **Cohere**: embed-english-v3.0, embed-multilingual-v3.0
- **Voyage AI**: voyage-large-2, voyage-code-2
- **Google**: Vertex AI embeddings

#### **Specialized Models**
- **Rerank Models**: Cohere rerank-3, Voyage rerank-lite
- **Moderation Models**: OpenAI moderation for content safety
- **Vision Models**: GPT-4V, Gemini Pro Vision for image understanding

### 📄 **Advanced Document Processing**

Gendox provides sophisticated document processing capabilities that go beyond simple file uploads:

#### **Supported File Formats**
- **PDF Documents**: Advanced PDF parsing with text extraction and structure preservation
- **Microsoft Word**: .docx files with formatting preservation  
- **Plain Text**: .txt files with encoding detection
- **Markdown**: .md files with rich formatting support
- **reStructuredText**: .rst files for technical documentation

#### **Intelligent Document Splitting**
- **Smart Chunking**: Context-aware document segmentation
- **Multiple Strategies**: Page-based, word-count, semantic splitting
- **Hierarchical Sections**: Maintain document structure and relationships
- **Metadata Preservation**: Retain document properties and custom fields

#### **Vector Embeddings & Search**
- **Semantic Search**: Find relevant content based on meaning, not just keywords
- **1536-dimensional embeddings** with pgvector for fast similarity search
- **Hybrid Search**: Combine semantic and traditional text search
- **Relevance Ranking**: AI-powered result reranking for improved accuracy

### 🔒 **Enterprise Security & Authentication**

Gendox is built with enterprise security requirements in mind:

#### **Authentication & Authorization**
- **Keycloak Integration**: Industry-standard identity provider
- **OAuth2/OIDC**: Secure, standardized authentication flows
- **JWT Tokens**: Stateless, secure API authentication
- **Multi-Factor Authentication**: Enhanced security for sensitive operations

#### **Access Control & Permissions**
- **Organization-Level Isolation**: Complete data segregation between organizations
- **Role-Based Access Control (RBAC)**: Fine-grained permission management
- **Project-Level Permissions**: Control access to specific AI agents and documents
- **API Key Management**: Secure programmatic access with granular scopes

#### **Data Security & Privacy**
- **Encryption at Rest**: Secure document and data storage
- **Encryption in Transit**: TLS/HTTPS for all communications
- **Content Moderation**: AI-powered content filtering and safety checks
- **Audit Logging**: Comprehensive activity tracking and compliance support

### 🔧 **Developer-Friendly Platform**

Gendox provides extensive tools and APIs for developers and technical teams:

#### **Comprehensive APIs**
- **REST API**: Full-featured API with OpenAPI/Swagger documentation
- **Rate Limiting**: Configurable API usage limits and throttling
- **Webhooks**: Real-time event notifications for integrations
- **Standardized Responses**: Consistent error handling and data formats

#### **Integration Options**
- **JavaScript SDK**: Frontend integration library
- **Website Widget**: Embeddable chat interface for websites
- **Discord Bot**: Ready-to-deploy Discord integration
- **Custom Integrations**: Flexible API for custom applications

#### **Development Tools**
- **Docker Compose**: Complete local development environment
- **Hot Reloading**: Rapid development and testing
- **Comprehensive Testing**: Unit, integration, and E2E test suites
- **Migration Tools**: Database schema management with Flyway

### 🌐 **Deployment & Integration Options**

Deploy Gendox agents wherever your users are:

#### **Cloud Storage Integrations**
- **AWS S3**: Automatic document sync with SQS event processing
- **Google Drive**: Direct integration with Google Workspace
- **Dropbox**: Business and personal Dropbox account sync
- **Git Repositories**: Sync documentation from GitHub, GitLab, etc.

#### **Communication Platforms**
- **Website Chat Widget**: Embeddable JavaScript widget
- **Discord Bot**: Native Discord server integration
- **Slack Bot**: Slack workspace integration (coming soon)
- **Microsoft Teams**: Teams app integration (roadmap)

#### **Enterprise Integrations**
- **Single Sign-On (SSO)**: OIDC/SAML integration with existing identity providers
- **LDAP/Active Directory**: Enterprise directory services
- **API Integration**: Connect to CRM, helpdesk, and business applications
- **Webhook Support**: Real-time event notifications and data sync

### 📊 **Analytics & Monitoring**

Track usage, performance, and user engagement:

- **Conversation Analytics**: Chat volume, user engagement, response quality
- **Document Performance**: Most referenced content, search patterns
- **AI Model Metrics**: Response times, token usage, cost optimization
- **User Behavior**: Usage patterns, feature adoption, satisfaction metrics

### 💼 **Subscription & Usage Management**

Flexible pricing and usage controls for organizations of all sizes:

#### **Subscription Tiers**
- **Free Tier**: Perfect for small teams and proof-of-concepts
- **Professional**: Advanced features for growing organizations  
- **Enterprise**: Full feature set with dedicated support and SLAs

#### **Usage Controls**
- **Rate Limiting**: Per-user and per-organization API limits
- **Usage Tracking**: Detailed analytics on API calls, messages, and processing
- **Cost Management**: AI model usage optimization and budgeting tools

## Quick Navigation

### 🚀 [Getting Started](getting-started/overview)
New to Gendox? Start here to learn the basics and get your first AI agent up and running.

### 👤 [User Manual](user-manual/registration)
Complete guide for end-users on how to use the platform, create projects, and manage AI agents.

### 👨‍💻 [Developer Guide](developer-guide/architecture)
Technical documentation for developers looking to contribute, deploy, or integrate with Gendox.

### 📡 [API Documentation](api/overview)
Comprehensive API reference and integration examples.

### 🔧 [Administration](administration/system-requirements)
System administration, deployment, and maintenance guides.

## Community and Support

- **Discord**: [Join our community](https://discord.gg/jWes2urauW)
- **GitHub**: [Contribute to the project](https://github.com/ctrl-space-labs/gendox-core)
- **LinkedIn**: [Follow Ctrl+Space Labs](https://www.linkedin.com/company/ctrl-space-labs)

## Open Source

Gendox is proudly open source under the MIT License. We welcome contributions from the community and believe in transparent, collaborative development.

---

Ready to get started? Head over to our [Getting Started Guide](getting-started/overview) to begin your journey with Gendox!
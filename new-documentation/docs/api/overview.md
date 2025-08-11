# API Overview

The Gendox API is a RESTful service that provides programmatic access to all platform functionality. Built with Spring Boot and documented with OpenAPI 3.0, it offers a comprehensive set of endpoints for managing organizations, projects, documents, and AI interactions.

## Base URL

```
https://app.gendox.dev/gendox/api/v1
```

For local development:
```
http://localhost:8080/gendox/api/v1
```

## API Documentation

- **Interactive Documentation**: [Swagger UI](https://app.gendox.dev/gendox/api/v1/swagger-ui/index.html)
- **OpenAPI Spec**: [openapi.json](https://app.gendox.dev/gendox/api/v1/v3/api-docs)

## Authentication

The Gendox API supports multiple authentication methods:

### 1. JWT Bearer Token (Recommended for user applications)
```http
Authorization: Bearer <jwt_token>
```

### 2. API Key (Recommended for server-to-server)
```http
X-API-Key: <your_api_key>
```

### 3. OAuth2 Authorization Code Flow
Standard OAuth2 flow for third-party integrations.

## Core Resources

### Organizations
Manage organizational accounts and settings.

```http
GET    /organizations                    # List organizations
POST   /organizations                    # Create organization
GET    /organizations/{id}               # Get organization
PUT    /organizations/{id}               # Update organization
DELETE /organizations/{id}               # Delete organization
```

### Projects
Manage AI projects within organizations.

```http
GET    /projects                         # List projects
POST   /projects                         # Create project
GET    /projects/{id}                    # Get project
PUT    /projects/{id}                    # Update project
DELETE /projects/{id}                    # Delete project
```

### Documents
Upload and manage documents for training AI agents.

```http
GET    /documents                        # List documents
POST   /documents                        # Upload document
GET    /documents/{id}                   # Get document
PUT    /documents/{id}                   # Update document
DELETE /documents/{id}                   # Delete document
GET    /documents/{id}/sections          # Get document sections
```

### Chat & Messages
Interact with AI agents through conversation.

```http
GET    /messages                         # List messages
POST   /messages                         # Send message
GET    /messages/{id}                    # Get message
POST   /messages/completions             # Get AI completion
POST   /messages/search                  # Search documents
```

### AI Models
Manage AI model configurations and settings.

```http
GET    /ai-models                        # List available AI models
GET    /ai-models/{id}                   # Get AI model details
PUT    /ai-models/{id}/config            # Update model config
```

## Request/Response Format

### Content Types
- **Request**: `application/json` (most endpoints)
- **File Upload**: `multipart/form-data`
- **Response**: `application/json`

### Standard Response Structure
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Pagination

List endpoints support pagination using query parameters:

```http
GET /documents?page=0&size=20&sort=createdAt,desc
```

**Parameters:**
- `page`: Page number (0-based, default: 0)
- `size`: Number of items per page (default: 20, max: 100)
- `sort`: Sort criteria in format `property,direction`

**Response includes pagination metadata:**
```json
{
  "content": [...],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": {
      "sorted": true,
      "orders": [...]
    }
  },
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false
}
```

## Filtering

Many endpoints support filtering using query parameters:

```http
GET /documents?organizationId=123&projectId=456&type=PDF
```

Common filter parameters:
- `organizationId`: Filter by organization
- `projectId`: Filter by project  
- `type`: Filter by document type
- `status`: Filter by status
- `createdAfter`: Filter by creation date
- `createdBefore`: Filter by creation date

## API Versioning

Gendox uses URL-based versioning:

- **Current Version**: `/gendox/api/v1/`
- **Future Versions**: `/gendox/api/v2/` (when available)

## Rate Limiting

API requests are rate-limited to ensure fair usage:

### Default Limits
- **Authenticated Users**: 1000 requests/hour
- **API Keys**: 5000 requests/hour (configurable per organization)
- **Anonymous**: 10 requests/hour

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248000
```

When rate limit is exceeded:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 1 hour."
  }
}
```

## Status Codes

### Success Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `204 No Content`: Request successful, no content returned

### Client Error Codes
- `400 Bad Request`: Invalid request format
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error`: Server error
- `502 Bad Gateway`: Upstream service error
- `503 Service Unavailable`: Service temporarily unavailable

## Common Patterns

### Creating Resources
```http
POST /projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My AI Project",
  "description": "Project description",
  "organizationId": "org-123"
}
```

### Uploading Files
```http
POST /documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="file"; filename="document.pdf"
Content-Type: application/pdf

[binary data]
--boundary
Content-Disposition: form-data; name="projectId"

project-456
--boundary--
```

### Getting AI Completions
```http
POST /messages/completions
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "What is the main topic of my documents?",
  "projectId": "project-456",
  "aiModelId": "gpt-4",
  "maxTokens": 500,
  "temperature": 0.7
}
```

## SDKs and Libraries

Official SDKs are available for popular languages:

### JavaScript/TypeScript
```bash
npm install @gendox/javascript-sdk
```

```javascript
import { GendoxClient } from '@gendox/javascript-sdk';

const client = new GendoxClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://app.gendox.dev/gendox/api/v1'
});

const response = await client.chat.sendMessage({
  projectId: 'project-id',
  message: 'Hello!'
});
```

### Python
```bash
pip install gendox-python-sdk
```

```python
from gendox import GendoxClient

client = GendoxClient(
    api_key="your-api-key",
    base_url="https://app.gendox.dev/gendox/api/v1"
)

response = client.chat.send_message(
    project_id="project-id",
    message="Hello!"
)
```

### Java
```xml
<dependency>
  <groupId>dev.gendox</groupId>
  <artifactId>gendox-java-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

```java
GendoxClient client = GendoxClient.builder()
    .apiKey("your-api-key")
    .baseUrl("https://app.gendox.dev/gendox/api/v1")
    .build();

ChatResponse response = client.chat()
    .sendMessage("project-id", "Hello!");
```

## Webhooks

Gendox supports webhooks for real-time event notifications:

### Supported Events
- `document.processed`: Document processing completed
- `message.received`: New message in chat thread
- `project.created`: New project created
- `organization.updated`: Organization settings changed

### Webhook Configuration
```http
POST /webhooks
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://your-app.com/webhook",
  "events": ["document.processed", "message.received"],
  "secret": "webhook-secret"
}
```

### Webhook Payload
```json
{
  "id": "evt_123456",
  "type": "document.processed",
  "data": {
    "documentId": "doc-789",
    "projectId": "project-456",
    "status": "completed",
    "processedAt": "2024-01-15T10:30:00Z"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Testing

### API Testing Tools
- **Postman Collection**: [Download collection](https://app.gendox.dev/api/postman-collection.json)
- **Insomnia Workspace**: [Import workspace](https://app.gendox.dev/api/insomnia-workspace.json)
- **OpenAPI Generator**: Generate client code in any language

### Test Environment
- **Base URL**: `https://test.gendox.dev/gendox/api/v1`
- **Test API Keys**: Available in your dashboard
- **Sample Data**: Pre-loaded test data available

## Next Steps

- **[Authentication Guide](authentication)**: Detailed authentication setup
- **[API Reference](endpoints)**: Complete endpoint documentation  
- **[Examples](examples)**: Code samples and use cases
- **[Rate Limiting](rate-limiting)**: Understanding limits and quotas
- **[Error Handling](error-handling)**: Best practices for error handling

Need help? Join our [Discord community](https://discord.gg/jWes2urauW) or check the [GitHub issues](https://github.com/ctrl-space-labs/gendox-core/issues).
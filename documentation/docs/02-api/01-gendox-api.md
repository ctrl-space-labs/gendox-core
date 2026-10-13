# Gendox API

This guide provides an overview of the main objects within the Gendox platform and how the APIs are structured to interact with these entities.

## Overview

Gendox is a collaborative platform that enables users to work across multiple **Organizations**, each housing multiple **Projects**. A project comprises two primary components:

- **AI Agent**: An intelligent agent trained on project-specific documents.
- **Documents**: A collection of files and data sources that the AI Agent uses for training.

Projects can integrate with external sources to import documents: a website Gendox reads by crawling it, a website that pushes its own content in through the plugin, an AWS S3 bucket watched through an SQS queue, and a Git repository. These integrations keep a project's documents in step with the source, so the AI Agent is trained on what the source holds today.

## Main Objects

### Users

- **Description**: Individuals who can be part of multiple organizations.
- **Key APIs**:
  - Create, update, and retrieve user profiles.
  - Deactivate users.
  - Manage user roles within organizations.

### Organizations

- **Description**: Collaborative groups that contain projects and users.
- **Key APIs**:
  - Create and update organizations.
  - Deactivate organizations.
  - Manage users within an organization.
  - Assign roles to users.

### Projects

- **Description**: Units within organizations that contain AI Agents and documents.
- **Key APIs**:
  - Create and update projects.
  - Deactivate projects.
  - Manage project members.
  - Integrate AI Agents.
  - Handle project-specific documents.

### AI Agents

- **Description**: Intelligent agents trained on documents to perform tasks.
- **Key APIs**:
  - Train AI Agents on project documents.
  - Manage AI Agent configurations.
  - Create verifiable presentation offers.

### Documents

- **Description**: Data sources imported into projects for AI training.
- **Key APIs**:
  - Create, update, and delete documents.
  - Upload and split documents.
  - Manage document sections.
  - Reorder document sections.

### Integrations

- **Description**: Connectors to external data sources for importing documents.
- **Key APIs**:
  - Create an integration under an organization, naming its type.
  - Turn one on or off, and set how often it runs.
  - Trigger every active integration of an organization.
  - Retrieve one, or list them by organization or project.
  - Remove one. The documents it has already produced stay in their project.

Every integration endpoint lives under the organization that owns it, because
the organization is what the caller's permission is checked against. Reading
needs `OP_READ_INTEGRATIONS` and everything else `OP_EDIT_INTEGRATIONS`.

## API Associations

The APIs are structured around the relationships between these main objects:

- **User APIs**: Focus on user management across organizations.
- **Organization APIs**: Handle organizational data and user associations.
- **Project APIs**: Manage projects, including AI Agents and project members.
- **Document APIs**: Deal with document lifecycle within projects.
- **Integration APIs**: Facilitate connections to external data sources.
- **AI Agent APIs**: Oversee the training and deployment of AI Agents within projects.

Each API endpoint is designed to perform specific actions on these objects, enabling a modular and scalable approach to managing resources within Gendox.

---

For detailed API endpoints and specifications, please refer to the [Swagger Documentation](https://app.gendox.dev/gendox/api/v1/swagger-ui/index.html).

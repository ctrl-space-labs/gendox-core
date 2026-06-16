# Gendox Administrator Guide

The Gendox system includes several administrative operations that ensure proper system maintenance and configuration. These operations primarily involve managing the database, application, and server.

## Creating a Gendox Super Admin

The Gendox Super Admin role grants the highest level of permissions within the system, allowing comprehensive management of all projects, users, and system configurations. Super Admin accounts can also be used for API integrations with trusted internal microservices or external third-party systems, such as payment processors.

### Steps to Create a Super Admin

Follow these steps to set up a Super Admin:

#### 1. Create a User or Client in Keycloak

- **Client:** Recommended for API-only access where only JWT authentication is required.
- **User:** Recommended for interactive human access through the Gendox UI.

**Creating a User:**

- Go to **Users** > **Credentials** in Keycloak and set a password for the user.

**Creating a Client:**

- Go to **Clients** > **Credentials** and generate a client secret.
- Enable service account roles by navigating to **Clients** > **Capability config** > **Authentication flow** and activating **Service Accounts Roles**.

#### 2. Register the User or Client in the Gendox Platform

**2.1 Obtain a JWT token:**

- The System Admin retrieves a JWT token for the new user or client using the Keycloak Admin API.

**2.2 Create Gendox User Profile:**

- Send a request to the following API endpoint:

```
GET https://[gendox-domain]/gendox/api/v1/profile
```

Gendox automatically creates a new user profile upon receiving a valid JWT.

#### 3. Assign Super Admin Role in the Database

- The Database Administrator must assign the Super Admin role directly in the database:
    - Locate the user by their `user_name` in the `gendox_core.users` table.
    - Set the `user_type_id` column to `[USER_TYPE,GENDOX_SUPER_ADMIN]` to grant Super Admin privileges.
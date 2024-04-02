# Configuration Files Documentation

This documentation provides an overview of the configuration files found within the `configs` folder of the application. These configurations are crucial for defining the behavior of different aspects of the application, including user permissions (using CASL), API endpoints, authentication settings, and theme customizations.

## User Permissions Configuration (acl.js)

### AppAbility and Ability Rules

- **AppAbility**: A wrapper around the CASL Ability class, used for defining user permissions throughout the application.
- **defineRulesFor**: A function to define permission rules based on the user's role. Admins can manage everything, while clients are limited to read access on the ACL page. Custom roles can be defined with specific CRUD operations on given subjects.
- **buildAbilityFor**: Initializes and returns an instance of `AppAbility` with rules defined for a specific role, including a custom `detectSubjectType` function for CASL's subject type detection.
- **defaultACLObj**: A default ACL object for easy reference, specifying a manage action on all subjects.

## API Configuration (apiRequest.js)

Defines base URLs and specific endpoints for interacting with the backend services, including user profile fetching, project management, and document handling.

- **URL Configuration**: Establishes base URLs for different API endpoints.
  - `getProfile`: Endpoint for fetching user profiles.
  - `getProjectById`: Endpoints for project management, dynamically including organization and project IDs in the URL.
  - `getDocumentsByProject`: Endpoints for document management, dynamically including organization and project IDs in the URL.

## Authentication Configuration

Specifies settings related to user authentication, including endpoints for login and registration, local storage keys for token management, and actions to take upon token expiration.
| Property | Example | Description |
|-----------------------|-------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| **getProfile** | `http://localhost:5000/gendox/api/v1/profile` | URL to the endpoint for fetching the authenticated user's profile information. |
| **loginEndpoint** | `https://dev.gendox.ctrlspace.dev/idp/realms/gendox-idp-dev/protocol/openid-connect/token` | Full URL to the login endpoint for verifying user credentials and issuing an authentication token.|
| **registerEndpoint** | `/jwt/register` | URL to the user registration endpoint for creating new accounts. |
| **storageTokenKeyName**| `accessToken` | The name of the local storage key for storing the authentication token. |
| **onTokenExpiration** | `refreshToken` | Strategy for handling token expiration, e.g., refreshing the token or logging out the user. |
| **selectedOrganizationId**| `activeOrganizationId` | Local storage key name for storing the identifier of the currently active or selected organization.|
| **selectedProjectId** | `activeProjectId` | Local storage key name for storing the identifier of the currently active or selected project. |
| **user** | `userData` | Local storage key name used to store serialized user data. |

## Theme Configuration (themeConfig)

Details the theme settings of the application, allowing customization of layout, color mode, directionality, and other UI aspects.

- **Layout and Mode**: Configures the app's layout direction (vertical/horizontal), theme mode (light/dark/semi-dark), and content width.
- **Navigation and Menu**: Customizes aspects of the navigation menu, such as visibility, text truncation, icon styles, and menu toggle behavior.
- **AppBar**: Adjusts the app bar's position and visibility.
- **Other UI Settings**: Includes settings for responsive font sizes, ripple effect, customizer tool, and toast notifications.

For a comprehensive overview and detailed explanations on theme configuration in the Materialize Next.js Admin Template, such as adjusting layout directions, theme modes, AppBar settings, and more, please visit the official documentation through this [Materialize Theme Configurations](https://demos.pixinvent.com/materialize-nextjs-admin-template/documentation/guide/settings/theme-config.html#overview).

### Important Notes

- Changes to these configurations require clearing the browser's local storage to take effect. Instructions for clearing local storage are provided within the theme configuration comments.

This documentation should serve as a reference for developers looking to understand or modify the application's configurations related to user permissions, API interactions, authentication processes, and thematic customizations.

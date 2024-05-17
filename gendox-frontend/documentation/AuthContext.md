# AuthContext Documentation

## Overview

`AuthContext` provides a comprehensive authentication framework within a React application. It facilitates user authentication processes including login, logout, and state management of user data, active projects, and organizations.

## Key Features

- **React Context and Hooks**: Leverages `createContext`, `useEffect`, and `useState` for state management and lifecycle operations.
- **Redux Integration**: Utilizes `useDispatch` for action dispatching in the Redux store (Note: Redux setup not enabled in the given code).
- **Next.js Routing**: Incorporates `useRouter` for navigation and parameter handling.
- **HTTP Requests**: Employs Axios for backend communication to manage user authentication and data retrieval.
- **Configurations**: Defines authentication settings and default states using `authConfig` and `defaultProvider`.

## Auth Context Structure

### Configuration and Defaults

- `authConfig`: Contains API endpoints and key names for local storage.
- `defaultProvider`: Sets initial context values, providing default user information and authentication-related functions.

### Provided Values

The context supplies components with the following values for managing authentication:

| Property             | Type     | Description                                 |
| -------------------- | -------- | ------------------------------------------- |
| `user`               | Object   | The currently logged-in user's object.      |
| `setUser`            | Function | Updates the logged-in user's state.         |
| `loading`            | Boolean  | Indicates if the application is loading.    |
| `setLoading`         | Function | Updates the loading state.                  |
| `login`              | Function | Authenticates the user.                     |
| `logout`             | Function | Logs out the user and clears state.         |
| `activeProject`      | Object   | The currently active project's object.      |
| `activeOrganization` | Object   | The currently active organization's object. |

## Core Components

- **AuthContext**: A React context created to share authentication data and methods across the application.
- **AuthProvider**: A component that wraps the application's components, providing them access to the authentication state and functions.

## Authentication Flow

1. **Initialization**: On component mount, checks for an existing authentication token. If present, fetches user profile; otherwise, triggers logout.
2. **Handling URL Changes**: Updates the active organization and project based on URL parameters.
3. **Login Process**: Manages the login flow by sending credentials, storing tokens, fetching user profile, and updating state.
4. **Logout Process**: Clears authentication data from local storage and state, redirecting to the login page.

## Additional Functionalities

- Dynamically manages active project and organization based on user data and URL changes.
- Seamlessly integrates with backend services for user authentication and data management.

## Migration Guide

For those interested in migrating from JWT authentication to NextAuth.js, this framework currently uses JWT. The documentation provides insights and examples on utilizing the AuthContext for managing user sessions and authentication states within your components.

---

This refined documentation structure aims to provide a clear and concise overview of the AuthContext functionality, making it accessible for developers to implement and customize within their React applications.
